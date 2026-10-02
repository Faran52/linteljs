// Vitest measures the merged suite, so a module can read 100% while its own suite leaves a branch uncovered.
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import {
  basename,
  dirname,
  join,
  relative,
} from 'node:path';
import process, { cwd } from 'node:process';
import { parseArgs } from 'node:util';

import PQueue from 'p-queue';

import {
  log,
  logDebug,
  logError,
} from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import config from '../../vitest.config.ts';

import {
  COVERED_BY_SHOWN,
  DATA_FILE,
  DOCUMENTED_SUITES,
  REPORTS_PREFIX,
  SOURCE_SUFFIX,
  TEST_SUFFIX,
  TIMEOUT_SECONDS,
} from './constants.ts';
import {
  attribute,
  describeGap,
  entriesOf,
  type FileCoverage,
  gapOf,
  hitsOf,
  isData,
  metricsOf,
} from './utils/coverageUtils.ts';
import { coverageRun, listTests } from './utils/runUtils.ts';
import { isBarrel } from './utils/sourceUtils.ts';

const root = cwd();
const { values } = parseArgs({
  options: {
    concurrency: { type: 'string' },
    timeout: { type: 'string' },
  },
});
const concurrency = Number(values.concurrency ?? availableParallelism());
const timeoutSeconds = Number(values.timeout ?? TIMEOUT_SECONDS);

if (!Number.isInteger(concurrency) || concurrency < 1) {
  logError(`--concurrency takes a whole number from 1, not ${values.concurrency ?? ''}`);
  process.exit(1);
}

if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1) {
  logError(`--timeout takes a whole number of seconds from 1, not ${values.timeout ?? ''}`);
  process.exit(1);
}

// Read rather than restated, so each run can switch them off.
const thresholdKeys = Object.entries(config.test?.coverage?.thresholds ?? {})
  .filter(([, value]) => {
    return typeof value === 'object';
  })
  .map(([key]) => {
    return key;
  });

const tests = listTests(root)
  .toSorted((left, right) => {
    return left.localeCompare(right);
  });
const reportsPrefix = join(tmpdir(), REPORTS_PREFIX);
const reports = mkdtempSync(reportsPrefix);
const started = performance.now();
const queue = new PQueue({ concurrency });

const hitsByTest = new Map<string, Map<string, Set<string>>>();
const maps = new Map<string, FileCoverage>();
const failed: string[] = [];
const timedOut: string[] = [];

try {
  const runs = tests
    .map(async (test, index) => {
      return queue
        .add(async () => {
          const reportsDirectory = join(reports, String(index));
          const report = await coverageRun(
            root,
            relative(root, test),
            reportsDirectory,
            thresholdKeys,
            timeoutSeconds * 1000,
          );

          logDebug(`${relative(root, test)} ${typeof report === 'string' ? report : 'done'}`);

          if (report === 'timed out') {
            timedOut.push(test);

            return;
          }

          if (report === 'failed') {
            failed.push(test);

            return;
          }

          const hits = new Map(Object.entries(report)
            .map(([file, coverage]) => {
              maps.set(file, coverage);

              const fileHits = [file, hitsOf(coverage)] as const;

              return fileHits;
            }));

          hitsByTest.set(test, hits);
        });
    });

  await Promise.all(runs);
}
finally {
  rmSync(reports, {
    recursive: true,
    force: true,
  });
}

const seconds = Math.round((performance.now() - started) / 1000);

// Three packages have a `meta.test.ts`.
const labelOf = (test: string): string => {
  const name = basename(test);

  return tests
    .filter((other) => {
      return basename(other) === name;
    }).length === 1
    ? name
    : relative(root, test);
};

const sourceOf = (test: string): string => {
  return `${test.slice(0, -TEST_SUFFIX.length)}${SOURCE_SUFFIX}`;
};

const claimOf = (test: string): string => {
  const directory = dirname(test);

  return join(directory, `${basename(test).split('.')[0] ?? ''}${SOURCE_SUFFIX}`);
};

const noSource = tests
  .filter((test) => {
    const source = sourceOf(test);

    return !existsSync(source);
  });
const documented = noSource
  .filter((test) => {
    const name = basename(test);

    return DOCUMENTED_SUITES.includes(name);
  });
const orphaned = noSource
  .filter((test) => {
    const name = basename(test);

    return !DOCUMENTED_SUITES.includes(name);
  });
const outOfScope = tests
  .filter((test) => {
    const source = sourceOf(test);

    return existsSync(source) && !maps.has(source);
  });
const paired = new Map(tests
  .filter((test) => {
    const source = sourceOf(test);

    return maps.has(source);
  })
  .map((test) => {
    const pair = [sourceOf(test), test] as const;

    return pair;
  }));
const claimants = Map.groupBy(tests, claimOf);
const claimedTwice = [...claimants]
  .filter(([, claiming]) => {
    return claiming.length > 1;
  })
  .map(([source, claiming]) => {
    return `${relative(root, source)}  claimed by: ${claiming
      .map(labelOf)
      .join(', ')}`;
  });

const explain = (file: string, coverage: FileCoverage, gap: string[], own?: string): string[] => {
  const others = new Map([...hitsByTest]
    .filter(([test]) => {
      return test !== own;
    })
    .map(([test, hits]) => {
      const labelledHits = [labelOf(test), hits.get(file) ?? new Set<string>()] as const;

      return labelledHits;
    }));
  const { coveredBy, uncovered } = attribute(gap, others);
  const shown = coveredBy.length > COVERED_BY_SHOWN
    ? [...coveredBy.slice(0, COVERED_BY_SHOWN), `and ${String(coveredBy.length - COVERED_BY_SHOWN)} more`]
    : coveredBy;
  const lines = [`  gap ${describeGap(coverage, gap)}  covered by: ${shown.join(', ') || 'none'}`];

  if (uncovered.length > 0) {
    lines.push(`  no run covers ${describeGap(coverage, uncovered)}: dead code or a missing test`);
  }

  return lines;
};

const short: string[] = [];
const untested: string[] = [];
const impure: string[] = [];
const data: string[] = [];
let barrels = 0;

for (const [file, coverage] of [...maps]
  .toSorted(([left], [right]) => {
    return left.localeCompare(right);
  })) {
  const test = paired.get(file);
  const path = relative(root, file);

  if (basename(file) === DATA_FILE && !isData(coverage)) {
    const functionAndBranchKeys = entriesOf(coverage)
      .filter((key) => {
        return !key.startsWith('s:');
      });

    impure.push(`${path}  ${describeGap(coverage, functionAndBranchKeys)}`);

    continue;
  }

  if (test === undefined) {
    if (basename(file) === DATA_FILE) {
      data.push(path);
      continue;
    }

    const source = readFileSync(file, 'utf8');

    if (isBarrel(source)) {
      barrels += 1;
      continue;
    }

    const entries = entriesOf(coverage);
    const entryLines = [path, ...explain(file, coverage, entries)];

    untested.push(entryLines.join('\n'));
    continue;
  }

  const run = hitsByTest.get(test);

  if (run === undefined) {
    continue;
  }

  const own = run.get(file) ?? new Set<string>();
  const gap = gapOf(coverage, own);

  if (gap.length > 0) {
    const entryLines = [`${path}  own ${metricsOf(coverage, own)}`, ...explain(file, coverage, gap, test)];

    short.push(entryLines.join('\n'));
  }
}

const listed = (heading: string, items: string[]): void => {
  if (items.length > 0) {
    log(`${heading} (${String(items.length)}):\n${items.join('\n')}\n`);
  }
};

const relativeTo = (test: string): string => {
  return relative(root, test);
};

listed('Short of full coverage from their own test file', short);
listed('Sources with no test file beside them', untested);
listed(`${DATA_FILE} must hold data only, and these hold a function or a branch`, impure);
listed('Sources more than one test file claims by name', claimedTwice);
listed('Test files with no source beside them', orphaned.map(relativeTo));
listed('Runs that wrote no coverage report', failed.map(relativeTo));
listed(`Runs killed at the ${String(timeoutSeconds)}s deadline`, timedOut.map(relativeTo));
listed(`Data, a ${DATA_FILE}, so no suite of its own`, data);

listed(
  'Skipped: the documented exceptions in .claude/rules/repo-structure.md, suites of a package rather than one file',
  documented.map(relativeTo),
);

listed('Out of scope, their source is outside the coverage include set', outOfScope.map(relativeTo));

log(`${String(paired.size)} pairs, ${String(short.length)} short, ${String(untested.length)} untested, `
  + `${String(impure.length)} impure ${DATA_FILE}, ${String(claimedTwice.length)} claimed twice, `
  + `${String(orphaned.length)} orphaned, ${String(data.length)} data, ${String(barrels)} barrels, `
  + `${String(timedOut.length)} timed out, `
  + `${String(documented.length)} documented exceptions, ${String(outOfScope.length)} out of scope; `
  + `${String(tests.length)} runs at concurrency ${String(concurrency)} in ${String(seconds)}s`);

const problems = [
  short,
  untested,
  impure,
  claimedTwice,
  orphaned,
  failed,
  timedOut,
];

if (problems
  .some((found) => {
    return found.length > 0;
  })) {
  process.exit(1);
}
