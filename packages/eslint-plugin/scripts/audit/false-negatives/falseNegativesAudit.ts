// Breaks real code a rule is silent on and lints again; `--neuter <id>` proves the detector can fail.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { orderBy, sum } from 'es-toolkit';
import { Linter } from 'eslint';

import {
  log,
  logError,
  logWarn,
} from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import {
  isTypeScript,
  nameFor,
  parseOrNull,
  type Program,
} from '../utils/astUtils.ts';
import {
  countMatches,
  interleave,
  isFirstSighting,
  messageOf,
  skipReason,
  sourcesFrom,
} from '../utils/corpusUtils.ts';
import {
  configFor,
  moduleOf,
  RULE_IDS,
} from '../utils/lintUtils.ts';

import { indexAst, type State } from './utils/editUtils.ts';
import {
  type Shape,
  SHAPES,
  TS_ONLY_RULES,
} from './utils/shapesUtils.ts';

import type { OptionValue } from '../utils/optionUtils.ts';

interface ActiveShape extends Shape {
  key: string;
  rule: string;
}

interface Reports {
  count: number;
  fatal: boolean;
}

interface Stats {
  attempts: number;
  cases: number;
  misses: number;
  seen: number;
  skips: Map<string, number>;
}

const DEFAULT_CASES_PER_SHAPE = 40;

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'rule': { type: 'string' },
    'shape': { type: 'string' },
    'neuter': { type: 'string' },
    'limit': { type: 'string' },
    'max-files': { type: 'string' },
  },
});

for (const name of [flags.rule, flags.neuter]) {
  if (name !== undefined && !RULE_IDS.includes(name)) {
    logError(`unknown rule: ${name}\nknown: ${RULE_IDS.join(', ')}`);
    process.exit(2);
  }
}

const casesWanted = flags.limit === undefined ? DEFAULT_CASES_PER_SHAPE : Number(flags.limit);
const maxFiles = flags['max-files'] === undefined ? Infinity : Number(flags['max-files']);
const sources = sourcesFrom(positionals);

if (sources.length === 0) {
  logError('no source directories found');
  process.exit(2);
}

const shapedRules = Object.keys(SHAPES);
const unshapedRules = RULE_IDS
  .filter((rule) => {
    return !shapedRules.includes(rule);
  });

// Said on every run, so a rule with no shapes is a visible gap rather than a quiet one.
if (unshapedRules.length > 0) {
  logWarn(`no false-negative shapes, so not audited: ${unshapedRules.join(', ')}`);
}

const selectedRules = flags.rule === undefined ? shapedRules : [flags.rule];
const activeShapes: ActiveShape[] = selectedRules
  .flatMap((rule) => {
    const shapes = SHAPES[rule];

    if (shapes === undefined) {
      logError(`No shapes for: ${rule}. Add one to SHAPES or drop --rule.`);
      process.exit(1);
    }

    return shapes
      .map((entry) => {
        return {
          ...entry,
          key: `${rule} :: ${entry.shape}`,
          rule,
        };
      });
  })
  .filter((entry) => {
    return flags.shape === undefined || entry.shape.includes(flags.shape);
  });

if (activeShapes.length === 0) {
  logError(`no shape matches: ${flags.shape ?? ''}`);
  process.exit(2);
}

const linter = new Linter();
const configCache = new Map<string, Linter.Config[]>();

// Inline configuration off, since a third-party disable would silence the provoked report.
const ruleConfig = (rule: string, options: Record<string, OptionValue> | undefined): Linter.Config[] => {
  const key = `${rule}|${JSON.stringify(options ?? null)}`;
  const cached = configCache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const module = moduleOf(rule);
  const entry: Linter.RuleEntry = options === undefined ? 'error' : ['error', options];
  const config = configFor(
    {
      [rule]: rule === flags.neuter
        ? {
            meta: module.meta,
            create: () => {
              return {};
            },
          }
        : module,
    },
    { [`@linteljs/${rule}`]: entry },
    {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'off',
    },
  );

  configCache.set(key, config);

  return config;
};

const reportsFor = (source: string, name: string, entry: ActiveShape): Reports => {
  const messages = linter.verify(source, ruleConfig(entry.rule, entry.options), name);

  return {
    fatal: messages
      .some((message) => {
        return message.fatal === true;
      }),
    count: messages
      .filter((message) => {
        return message.ruleId === `@linteljs/${entry.rule}`;
      }).length,
  };
};

const statsEntries = activeShapes
  .map((entry): [string, Stats] => {
    return [entry.key, {
      attempts: 0,
      cases: 0,
      misses: 0,
      seen: 0,
      skips: new Map(),
    }];
  });

const stats = new Map(statsEntries);

const statsOf = (entry: ActiveShape): Stats => {
  const found = stats.get(entry.key);

  if (found === undefined) {
    throw new Error(`no stats for ${entry.key}`);
  }

  return found;
};

const noteSkip = (entry: ActiveShape, reason: string): void => {
  const { skips } = statsOf(entry);

  skips.set(reason, (skips.get(reason) ?? 0) + 1);
};

const describeShape = (entry: ActiveShape): string => {
  return entry.options ? `${entry.shape} ${JSON.stringify(entry.options)}` : entry.shape;
};

const snippetAt = (source: string, offset: number): string => {
  const line = countMatches(source.slice(0, offset), /\n/g) + 1;

  return source
    .split('\n')
    .slice(Math.max(0, line - 2), line + 3)
    .join('\n');
};

// Cached per rule and options: six shapes of one rule would otherwise pay six passes.
const attempt = (entry: ActiveShape, file: string, state: State, name: string, cache: Map<string, Reports>): void => {
  const candidate = entry.build(state);

  if (!candidate) {
    return;
  }

  const bucket = statsOf(entry);
  const cacheKey = `${entry.rule}|${JSON.stringify(entry.options ?? null)}`;
  const before = cache.get(cacheKey) ?? reportsFor(state.source, name, entry);

  cache.set(cacheKey, before);
  bucket.attempts += 1;

  if (before.fatal) {
    noteSkip(entry, 'file does not lint cleanly under this parser');

    return;
  }

  if (before.count > 0) {
    noteSkip(entry, 'file already reports for this rule, so silence would prove nothing');

    return;
  }

  const after = reportsFor(candidate.source, name, entry);

  if (after.fatal) {
    noteSkip(entry, 'transformation produced invalid syntax');

    return;
  }

  bucket.cases += 1;

  if (after.count > 0) {
    bucket.seen += 1;

    return;
  }

  bucket.misses += 1;
  logError([
    `false negative: @linteljs/${entry.rule}`,
    `  shape: ${describeShape(entry)}`,
    `  ${file}`,
    '  the file was silent for this rule, the edit below broke it, and it stayed silent',
    '  transformed source:',
    ...snippetAt(candidate.source, candidate.offset)
      .split('\n')
      .map((line) => {
        return `    ${line}`;
      }),
  ].join('\n'));
};

const counts = {
  duplicate: 0,
  scanned: 0,
  skipped: 0,
  unparsed: 0,
};
const seen = new Set<string>();

const shapesStillHungry = (): ActiveShape[] => {
  return activeShapes
    .filter((entry) => {
      return statsOf(entry).cases < casesWanted;
    });
};

const load = (file: string): [string, string, Program] | undefined => {
  const source = readFileSync(file, 'utf8');

  if (skipReason(source) !== undefined || source.includes('eslint-disable')) {
    counts.skipped += 1;

    return undefined;
  }

  if (!isFirstSighting(seen, source)) {
    counts.duplicate += 1;

    return undefined;
  }

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    counts.unparsed += 1;

    return undefined;
  }

  return [
    source,
    name,
    ast,
  ];
};

const check = (file: string, hungry: ActiveShape[]): void => {
  const loaded = load(file);

  if (loaded === undefined) {
    return;
  }

  const [
    source,
    name,
    ast,
  ] = loaded;
  const index = indexAst(ast);
  const cache = new Map<string, Reports>();

  counts.scanned += 1;

  for (const entry of hungry) {
    if (!TS_ONLY_RULES.has(entry.rule) || isTypeScript(name)) {
      attempt(entry, file, {
        ast,
        index,
        source,
        skip: (reason) => {
          noteSkip(entry, reason);
        },
      }, name, cache);
    }
  }
};

log([
  `up to ${String(maxFiles)} files, one from each source in turn, under:`,
  ...sources
    .map((dir) => {
      return `    ${dir}`;
    }),
  `rules: ${selectedRules.join(', ')}`,
  `shapes: ${String(activeShapes.length)} distinct ways of breaking them`,
  `target: ${String(casesWanted)} transformed cases per shape`,
].join('\n'));

if (flags.neuter !== undefined) {
  logWarn(`NEUTERED: @linteljs/${flags.neuter} is stubbed to report nothing, every case must miss`);
}

let visited = 0;
let lastPrint = Date.now();

// Lazy, so the walk stops once every shape has its cases.
for (const file of interleave(sources).take(maxFiles)) {
  const hungry = shapesStillHungry();

  if (hungry.length === 0) {
    break;
  }

  visited += 1;

  // One pathological file must not end the run.
  try {
    check(file, hungry);
  }
  catch (error) {
    logError(`threw: ${file}\n  ${messageOf(error)}`);
  }

  if (Date.now() - lastPrint > 3000) {
    log(`${String(visited)} files, ${String(counts.scanned)} linted, `
      + `${String(activeShapes.length - shapesStillHungry().length)}/${String(activeShapes.length)} shapes full`);
    lastPrint = Date.now();
  }
}

log(`${String(counts.scanned)} of ${String(visited)} files linted, skipped ${String(counts.skipped)} oversized, `
  + `minified, compiled or already-disabled, ${String(counts.duplicate)} duplicates, ${String(counts.unparsed)} the `
  + 'parser rejected');

// `attempted` counts edits built; `skipped` also counts candidates declined before any edit, so it can be larger.
const report = selectedRules
  .flatMap((rule) => {
    const shapes = activeShapes
      .filter((entry) => {
        return entry.rule === rule;
      });

    return shapes.length === 0
      ? []
      : [`@linteljs/${rule}`, ...shapes
          .flatMap((entry) => {
            const bucket = statsOf(entry);

            return [
              `  ${describeShape(entry)}`,
              `    ${String(bucket.attempts)} attempted, ${String(sum([...bucket.skips.values()]))} skipped, `
              + `${String(bucket.cases)} expected, ${String(bucket.seen)} seen, ${String(bucket.misses)} missed`,
              ...orderBy([...bucket.skips], [1], ['desc'])
                .map(([reason, count]) => {
                  return `    skipped ${String(count)}: ${reason}`;
                }),
            ];
          })];
  });

log(['per shape: attempted, skipped, expected, seen, missed', ...report].join('\n'));

const misses = activeShapes
  .map((entry) => {
    return statsOf(entry).misses;
  });

const missed = sum(misses);
const starved = activeShapes
  .filter((entry) => {
    return statsOf(entry).cases === 0;
  }).length;

if (starved > 0) {
  logError(`${String(starved)} shape(s) got no transformed case at all. That is not a pass; widen the corpus.`);
}

if (missed === 0) {
  log('every deliberately broken input was reported');
}
else {
  logError(`${String(missed)} false negative(s). Read the transformations before reading these as rule defects: a `
    + 'large count is a broken edit far more often than a broken rule.');
}

process.exitCode = missed > 0 || starved > 0 ? 1 : 0;
