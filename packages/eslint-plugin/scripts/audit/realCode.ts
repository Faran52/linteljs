/**
 * Runs every fixer over real third-party code, since the unit suite and mutation gate only know the corpus we wrote.
 * Each fix must parse, converge, and keep every token, comment, comment anchor and line ending; nothing is written
 * back. Report-only rules and arrow conversions are judged against shapes read off the AST, and each file's fix
 * time is recorded so a superlinear rule shows up. `--options` repeats the checks under every `meta.schema` option.
 *
 * Usage: node scripts/audit/realCode.ts [dir...] [--rule <id>] [--max-files <n>] [--options]
 */
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { countBy, orderBy } from 'es-toolkit';
import { Linter } from 'eslint';

import {
  log,
  logError,
  logWarn,
} from '../../../../scripts/utils/loggerUtils.ts';

import {
  nameFor,
  parse,
  parseOrNull,
} from './utils/astUtils.ts';
import {
  filesUnder,
  isFirstSighting,
  messageOf,
  skipReason,
  sourcesFrom,
} from './utils/corpusUtils.ts';
import {
  commentDiff,
  commentMoveDiff,
  endingsDiff,
  multisetDiff,
  orderedDiff,
} from './utils/diffUtils.ts';
import {
  configFor,
  moduleOf,
  RULE_IDS,
} from './utils/lintUtils.ts';
import { configurationsFor } from './utils/optionUtils.ts';
import {
  atReport,
  AUDIT_RULES,
  hoistedProbe,
  judge,
  shapesOf,
} from './utils/reportShapeUtils.ts';
import { showTiming } from './utils/timingUtils.ts';

import type { Program, Token } from './utils/astUtils.ts';
import type { SkipReason } from './utils/corpusUtils.ts';
import type { Configuration, OptionValue } from './utils/optionUtils.ts';
import type { Finding } from './utils/reportShapeUtils.ts';
import type { Dominant, Timing } from './utils/timingUtils.ts';

type Flavour = 'js' | 'ts';

interface Located extends Finding {
  file: string;
  flavour: Flavour;
}

interface AuditFinding extends Finding {
  line: number;
}

type Diff = (before: Token[], after: Token[]) => string | undefined;

interface Evaluation {
  changed: boolean;
  findings: Finding[];
  fixed: string;
}

type Counts = Record<'changed'
  | 'duplicate'
  | 'scanned'
  | 'unparsed'
  | SkipReason, number>;

interface SweepCounter {
  changed: number;
  findings: number;
  scanned: number;
}

// Fixers that may only insert or remove whitespace, so token order holds.
const ORDERED_RULES = [
  'destructuring-property-newline',
  'export-specifier-newline',
  'import-newlines',
  'member-newline',
  'union-newline',
];

// Those, plus the two that may move a member: same tokens, different order.
const MOVE_RULES = [...ORDERED_RULES, 'interface-order', 'sort-hook-dependencies'];

// A sweep pays for the corpus once per configuration, so it samples.
const DEFAULT_OPTION_FILES = 2000;

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'rule': { type: 'string' },
    'max-files': { type: 'string' },
    'options': {
      type: 'boolean',
      default: false,
    },
  },
});

if (flags.rule !== undefined && !RULE_IDS.includes(flags.rule)) {
  logError(`unknown rule: ${flags.rule}\nknown: ${RULE_IDS.join(', ')}`);
  process.exit(2);
}

const activeRules = flags.rule === undefined ? RULE_IDS : [flags.rule];
const defaultMaxFiles = flags.options ? DEFAULT_OPTION_FILES : Infinity;
const maxFiles = flags['max-files'] === undefined ? defaultMaxFiles : Number(flags['max-files']);
const sources = sourcesFrom(positionals);

if (sources.length === 0) {
  logError('no source directories found');
  process.exit(2);
}

const linter = new Linter();
const configCache = new Map<string, Linter.Config[]>();

// The options every config carries, by rule id. Module-level because the passes are sequential and only one is live.
let currentOptions: Record<string, Record<string, OptionValue>> = {};

const pluginConfig = (names: string[]): Linter.Config[] => {
  const key = `${names.join(',')}|${JSON.stringify(currentOptions)}`;
  const cached = configCache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const config = configFor(
    Object.fromEntries(names.map((name) => {
      return [name, moduleOf(name)];
    })),
    Object.fromEntries(names.map((name) => {
      const options = currentOptions[name];
      const entry: Linter.RuleEntry = options === undefined ? 'error' : ['error', options];

      return [`@linteljs/${name}`, entry];
    })),
    // Files disable rules this config never loads, and ESLint 9+ deletes such a comment when left on.
    { reportUnusedDisableDirectives: 'off' },
  );

  configCache.set(key, config);

  return config;
};

const auditConfig = pluginConfig(AUDIT_RULES).map((entry) => {
  return {
    ...entry,
    plugins: {
      ...entry.plugins,
      probe: { rules: { hoisted: hoistedProbe } },
    },
    rules: {
      ...entry.rules,
      'probe/hoisted': 'error' as const,
    },
  };
});

// The first `fix` of the current file, which is the whole-plugin pass a consumer pays for. Later calls attribute.
const fixTimes: number[] = [];

const fix = (source: string, name: string, names: string[]): string => {
  const started = performance.now();
  const { output } = linter.verifyAndFix(source, pluginConfig(names), name);

  if (fixTimes.length === 0) {
    fixTimes.push(performance.now() - started);
  }

  return output;
};

const parsedFix = (source: string, name: string, names: string[]): Program | undefined => {
  if (names.length === 0) {
    return undefined;
  }

  const fixed = fix(source, name, names);

  // Unparseable output is its own finding and is reported there.
  return fixed === source ? undefined : parseOrNull(fixed, name) ?? undefined;
};

const subsetOf = (candidates: string[], names: string[]): string[] => {
  return candidates.filter((rule) => {
    return names.includes(rule);
  });
};

// A changed token stream proves nothing on its own: re-run the subsets that promise to keep it, and name the breaker.
const attributeTokens = (source: string, tokens: Token[], name: string, names: string[]): Finding | undefined => {
  const scopes: [Diff, string[]][] = [
    [orderedDiff, subsetOf(ORDERED_RULES, names)],
    [multisetDiff, subsetOf(MOVE_RULES, names)],
  ];

  for (const [diff, subset] of scopes) {
    const breaks = (rules: string[]): string | undefined => {
      const after = parsedFix(source, name, rules);

      return after ? diff(tokens, after.tokens) : undefined;
    };
    const detail = breaks(subset);

    if (detail !== undefined) {
      const culprits = subset.filter((rule) => {
        return breaks([rule]) !== undefined;
      });

      return {
        category: 'token loss',
        rules: culprits.length > 0 ? culprits : subset,
        detail,
      };
    }
  }

  return undefined;
};

// Only whitespace fixers are asked: `prefer-arrow-functions` moves which name sits nearest an untouched comment.
const attributeCommentMoves = (source: string, ast: Program, name: string, names: string[]): Finding | undefined => {
  const subset = subsetOf(ORDERED_RULES, names);
  const moves = (rules: string[]): string | undefined => {
    const after = parsedFix(source, name, rules);

    return after ? commentMoveDiff(ast, after) : undefined;
  };
  const detail = moves(subset);

  if (detail === undefined) {
    return undefined;
  }

  const culprits = subset.filter((rule) => {
    return moves([rule]) !== undefined;
  });

  return {
    category: 'comment moved',
    rules: culprits.length > 0 ? culprits : subset,
    detail,
  };
};

const inspect = (source: string, ast: Program, fixed: string, name: string, names: string[]): Finding[] => {
  const after = parseOrNull(fixed, name);

  if (!after) {
    let detail = 'output does not parse';

    try {
      parse(fixed, name);
    }
    catch (error) {
      detail = messageOf(error);
    }

    return [{
      category: 'unparseable',
      rules: names,
      detail,
    }];
  }

  const comments = commentDiff(ast.comments, after.comments);
  const endings = endingsDiff(source, fixed);

  return [
    fix(fixed, name, names) === fixed
      ? undefined
      : {
          category: 'non-convergent',
          rules: names,
          detail: 'a second --fix pass changed it again',
        },
    orderedDiff(ast.tokens, after.tokens) === undefined ? undefined : attributeTokens(source, ast.tokens, name, names),
    comments === undefined
      ? undefined
      : {
          category: 'comment loss',
          rules: names,
          detail: comments,
        },
    commentMoveDiff(ast, after) === undefined ? undefined : attributeCommentMoves(source, ast, name, names),
    endings === undefined
      ? undefined
      : {
          category: 'line-ending change',
          rules: names,
          detail: endings,
        },
  ].filter((finding) => {
    return finding !== undefined;
  });
};

// `parsed` spares a caller that already holds the AST a second parse.
const evaluate = (source: string, name: string, names: string[], parsed?: Program): Evaluation => {
  const ast = parsed ?? parseOrNull(source, name);
  const fixed = ast ? fix(source, name, names) : source;

  return {
    changed: fixed !== source,
    findings: ast && fixed !== source ? inspect(source, ast, fixed, name, names) : [],
    fixed,
  };
};

const lineOf = (text: string, offset: number): number => {
  return text.slice(0, offset).split('\n').length - 1;
};

const changedLines = (source: string, fixed: string): [number, number] => {
  let start = 0;

  while (start < source.length && source[start] === fixed[start]) {
    start += 1;
  }

  let back = 0;

  while (back < source.length - start && back < fixed.length - start
    && source[source.length - 1 - back] === fixed[fixed.length - 1 - back]) {
    back += 1;
  }

  return [lineOf(source, start), lineOf(source, source.length - back)];
};

// The smallest slice that still shows the category, widening outwards: a two-line slice rarely parses on its own.
const narrow = (source: string, fixed: string, name: string, finding: Finding): [string, string] => {
  const lines = source.split('\n');
  const [first, last] = changedLines(source, fixed);
  const slice = (pad: number): string => {
    return `${lines.slice(Math.max(0, first - pad), Math.min(lines.length, last + pad + 1)).join('\n')}\n`;
  };

  for (const pad of [0, 1, 2, 4, 8, 16, 32]) {
    if (evaluate(slice(pad), name, finding.rules).findings.some((candidate) => {
      return candidate.category === finding.category;
    })) {
      return [slice(pad), 'minimal reproduction'];
    }
  }

  return [`${lines.slice(Math.max(0, first - 3), Math.min(lines.length, last + 4)).join('\n')}\n`,
    'changed hunk, could not narrow'];
};

const attribute = (source: string, name: string, names: string[], category: string): string[] => {
  return names.filter((rule) => {
    return evaluate(source, name, [rule]).findings.some((finding) => {
      return finding.category === category;
    });
  });
};

// Each rule alone with an empty pass subtracted, since the parse is most of a large file's cost. Slowest files only.
const dominantRule = (file: string): Dominant => {
  const source = readFileSync(file, 'utf8');
  const name = nameFor(file, source);
  const timed = (names: string[]): number => {
    const started = performance.now();

    linter.verifyAndFix(source, pluginConfig(names), name);

    return performance.now() - started;
  };
  const baseline = timed([]);

  return activeRules.reduce((worst, rule) => {
    const ms = timed([rule]) - baseline;

    return ms > worst.ms
      ? {
          baseline,
          ms,
          rule,
        }
      : worst;
  }, {
    baseline,
    ms: -Infinity,
    rule: 'none',
  });
};

const show = (file: string, finding: Finding, snippet: string, label: string): void => {
  logError([
    `${finding.category}: ${file}`,
    `  rules: ${finding.rules.join(', ')}`,
    `  ${finding.detail}`,
    `  ${label}:`,
    ...snippet.split('\n').slice(0, 40).map((line) => {
      return `    ${line}`;
    }),
  ].join('\n'));
};

const around = (source: string, line: number): string => {
  return `${source.split('\n').slice(Math.max(0, line - 3), line + 2).join('\n')}\n`;
};

const flavourOf = (file: string): Flavour => {
  return ['.ts', '.tsx'].includes(extname(file)) ? 'ts' : 'js';
};

const findings: Located[] = [];
const timings: Timing[] = [];
const auditCounts = new Map<string, number>();
const auditVolume: [number, string][] = [];
const seen = new Set<string>();
const emptyCounts = (): Counts => {
  return {
    changed: 0,
    compiled: 0,
    duplicate: 0,
    minified: 0,
    oversized: 0,
    scanned: 0,
    unparsed: 0,
  };
};
const counts: Record<Flavour, Counts> = {
  js: emptyCounts(),
  ts: emptyCounts(),
};

// Only what this plugin said counts: a disable comment naming an unloaded rule arrives under that rule's id.
const audit = (file: string, source: string, ast: Program, name: string): AuditFinding[] => {
  const reports = linter.verify(source, auditConfig, name);

  if (reports.some((report) => {
    return report.fatal === true;
  })) {
    return [];
  }

  const probed = new Set(reports.filter((report) => {
    return report.ruleId === 'probe/hoisted';
  }).map(atReport));
  const own = reports.filter((report) => {
    return report.ruleId?.startsWith('@linteljs/') === true;
  });
  const shapes = shapesOf(ast);

  for (const report of own) {
    auditCounts.set(report.ruleId ?? '', (auditCounts.get(report.ruleId ?? '') ?? 0) + 1);
  }

  if (own.length > 0) {
    auditVolume.push([own.length, file]);
  }

  return own.flatMap((report) => {
    const finding = judge(report, shapes, probed);

    return finding === undefined
      ? []
      : [{
          ...finding,
          line: report.line,
        }];
  });
};

// Read, skip, dedupe and parse: the steps both passes share.
const load = (file: string, bucket: Counts): [string, string, Program] | undefined => {
  const source = readFileSync(file, 'utf8');
  const skipped = skipReason(source);

  if (skipped !== undefined) {
    bucket[skipped] += 1;

    return undefined;
  }

  if (!isFirstSighting(seen, source)) {
    bucket.duplicate += 1;

    return undefined;
  }

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    bucket.unparsed += 1;

    return undefined;
  }

  return [source, name, ast];
};

const check = (file: string): void => {
  const flavour = flavourOf(file);
  const bucket = counts[flavour];
  const loaded = load(file, bucket);

  if (loaded === undefined) {
    return;
  }

  const [source, name, ast] = loaded;

  bucket.scanned += 1;
  fixTimes.length = 0;

  for (const finding of audit(file, source, ast, name)) {
    findings.push({
      file,
      flavour,
      ...finding,
    });
    show(file, finding, around(source, finding.line), `reported at line ${String(finding.line)}`);
  }

  const result = evaluate(source, name, activeRules, ast);

  // Before the attribution below, which re-lints the file and would land in the sample as its cost.
  const [firstFixMs] = fixTimes;

  if (firstFixMs !== undefined) {
    timings.push({
      bytes: source.length,
      file,
      ms: firstFixMs,
    });
  }

  if (!result.changed) {
    return;
  }

  bucket.changed += 1;

  for (const finding of result.findings) {
    const culprits = finding.rules.length > 1 ? attribute(source, name, finding.rules, finding.category) : [];
    const named = {
      ...finding,
      rules: culprits.length > 0 ? culprits : finding.rules,
    };
    const [snippet, label] = narrow(source, result.fixed, name, named);

    findings.push({
      file,
      flavour,
      ...named,
    });
    show(file, named, snippet, label);
  }
};

// A prefix for the fix pass. The sweep takes every nth, since a prefix of `node_modules` holds no React to sort.
const sampled = (): string[] => {
  const found = sources.flatMap((dir) => {
    return [...filesUnder(dir)];
  });
  const stride = Math.ceil(found.length / maxFiles);

  return found.filter((_, index) => {
    return index % stride === 0;
  });
};

const prefix = (): string[] => {
  return sources.values().flatMap(filesUnder).take(maxFiles).toArray();
};

const files = flags.options ? sampled() : prefix();

const tally = (keyOf: (finding: Located) => string): string[] => {
  return orderBy(Object.entries(countBy(findings, keyOf)), [1], ['desc']).map(([key, count]) => {
    return `  ${String(count)}  ${key}`;
  });
};

const runFixPass = (): void => {
  const typescript = files.filter((file) => {
    return flavourOf(file) === 'ts';
  }).length;

  log([
    `${String(files.length)} files (${String(typescript)} TypeScript, ${String(files.length - typescript)} `
    + 'JavaScript) under:',
    ...sources.map((dir) => {
      return `    ${dir}`;
    }),
    `rules: ${activeRules.join(', ')}`,
    `audit: ${AUDIT_RULES.join(', ')}`,
  ].join('\n'));

  const startedAt = Date.now();

  for (const [index, file] of files.entries()) {
    // One pathological file must not end the run, and a crash inside a rule is what this exists to surface.
    try {
      check(file);
    }
    catch (error) {
      const finding = {
        category: 'threw',
        rules: activeRules,
        detail: messageOf(error),
      };

      findings.push({
        file,
        flavour: flavourOf(file),
        ...finding,
      });
      show(file, finding, '', 'no snippet');
    }

    if ((index + 1) % 500 === 0) {
      log(`${String(index + 1)}/${String(files.length)} files, ${String(counts.ts.changed + counts.js.changed)} `
        + `fixed, ${String(findings.length)} findings`);
    }
  }

  const wallMs = Date.now() - startedAt;

  for (const [flavour, label] of [['ts', 'TypeScript'], ['js', 'JavaScript']] as const) {
    const bucket = counts[flavour];
    const hits = findings.filter((finding) => {
      return finding.flavour === flavour;
    }).length;

    log(`${label}: ${String(bucket.scanned)} files linted, ${String(bucket.changed)} changed by a fixer, `
      + `${String(hits)} findings\n  skipped: ${String(bucket.compiled)} compiled, ${String(bucket.minified)} `
      + `minified or bundled, ${String(bucket.oversized)} oversized, ${String(bucket.duplicate)} duplicates, `
      + `${String(bucket.unparsed)} the parser rejected`);
  }

  // Volume is not a defect, but one rule owning a file's reports is worth a look.
  log([
    'reports across the corpus:',
    ...orderBy([...auditCounts], [1], ['desc']).map(([ruleId, count]) => {
      return `  ${String(count).padStart(7)}  ${ruleId}`;
    }),
    'busiest files:',
    ...orderBy(auditVolume, [0], ['desc']).slice(0, 5).map(([count, file]) => {
      return `  ${String(count).padStart(7)}  ${file}`;
    }),
  ].join('\n'));

  showTiming(timings, wallMs, dominantRule);

  if (findings.length === 0) {
    log('every fix parsed, converged, and kept every token, line ending and comment, each still written against '
      + 'the code it was written against; every conversion and report matched the shape its rule claims');

    return;
  }

  logError([`${String(findings.length)} findings`, ...tally((finding) => {
    return finding.category;
  }), 'by rule:', ...tally((finding) => {
    return finding.rules.join(', ');
  })].join('\n'));
  process.exitCode = 1;
};

const sweep = (file: string, configurations: Configuration[], counters: Map<string, SweepCounter>): number => {
  // The sweep reports no skip counts, so they land in a bucket nothing reads.
  const loaded = load(file, emptyCounts());

  if (loaded === undefined) {
    return 0;
  }

  const [source, name, ast] = loaded;
  let hits = 0;

  for (const configuration of configurations) {
    const counter = counters.get(configuration.label);

    if (counter === undefined) {
      continue;
    }

    currentOptions = configuration.options;

    const result = evaluate(source, name, [configuration.rule], ast);

    counter.scanned += 1;
    counter.changed += result.changed ? 1 : 0;

    for (const finding of result.findings) {
      const [snippet, label] = narrow(source, result.fixed, name, finding);

      logError(`under ${configuration.label}`);
      show(file, finding, snippet, label);
      counter.findings += 1;
      hits += 1;
    }
  }

  currentOptions = {};

  return hits;
};

const runOptionSweep = (): void => {
  const configurations = activeRules.flatMap(configurationsFor);

  if (configurations.length === 0) {
    logWarn('no rule in this run declares an option, so there is nothing to sweep');

    return;
  }

  log([
    `${String(files.length)} files sampled, against ${String(configurations.length)} configurations read off `
    + 'meta.schema:',
    ...configurations.map(({ label }) => {
      return `    ${label}`;
    }),
  ].join('\n'));

  const counters = new Map(configurations.map(({ label }): [string, SweepCounter] => {
    return [label, {
      changed: 0,
      findings: 0,
      scanned: 0,
    }];
  }));
  let hits = 0;

  for (const [index, file] of files.entries()) {
    // A crash under a non-default option is the defect this sweep exists to find.
    try {
      hits += sweep(file, configurations, counters);
    }
    catch (error) {
      logError(`threw: ${file}\n  ${messageOf(error)}`);
      hits += 1;
    }

    if ((index + 1) % 250 === 0) {
      log(`${String(index + 1)}/${String(files.length)} files, ${String(hits)} findings`);
    }
  }

  log([
    'per configuration: files linted, files changed by the fixer, findings',
    ...configurations.map(({ label }) => {
      const counter = counters.get(label);

      return `  ${String(counter?.scanned ?? 0).padStart(6)} ${String(counter?.changed ?? 0).padStart(6)} `
        + `${String(counter?.findings ?? 0).padStart(4)}  ${label}`;
    }),
  ].join('\n'));

  if (hits === 0) {
    log('every fix parsed, converged, and kept every token, line ending and comment under every configuration');

    return;
  }

  logError(`${String(hits)} findings`);
  process.exitCode = 1;
};

if (flags.options) {
  runOptionSweep();
}
else {
  runFixPass();
}
