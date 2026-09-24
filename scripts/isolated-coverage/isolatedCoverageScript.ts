/**
 * Shows every source file is covered by the test file beside it alone. Vitest measures the merged suite, so a module
 * can read 100% while its own suite leaves a branch to some other file's run. Each collected test file runs in its own
 * process with coverage on; the run of `x.test.ts` is `x.ts`'s own coverage, and every other run's hits name the
 * suites that cover the rest by pass-through. A gap no run hits is dead code or a missing test.
 *
 * A source with statements but no function and no branch is data, a table, and needs no suite of its own: asserting
 * a table equal to itself proves nothing. Such a file is listed as data rather than as untested.
 *
 * Usage: tsx scripts/isolated-coverage/isolatedCoverageScript.ts [--concurrency <n>] [--timeout <seconds>]
 */
import {
  existsSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import {
  basename,
  join,
  relative,
} from 'node:path';
import process, { cwd } from 'node:process';
import { parseArgs } from 'node:util';

import PQueue from 'p-queue';

import config from '../../vitest.config.ts';
import {
  log,
  logDebug,
  logError,
} from '../utils/loggerUtils.ts';

import {
  COVERED_BY_SHOWN,
  REPORTS_PREFIX,
  SOURCE_SUFFIX,
  TEST_SUFFIX,
  TIMEOUT_SECONDS,
} from './constants.ts';
import {
  attribute,
  describeGap,
  entriesOf,
  gapOf,
  hitsOf,
  isData,
  metricsOf,
} from './utils/coverageUtils.ts';
import { coverageRun, listTests } from './utils/runUtils.ts';

import type { FileCoverage } from './utils/coverageUtils.ts';

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

// The glob-keyed thresholds, read rather than restated, so each run can switch them off.
const thresholdKeys = Object.entries(config.test?.coverage?.thresholds ?? {}).filter(([, value]) => {
  return typeof value === 'object';
}).map(([key]) => {
  return key;
});

const tests = listTests(root).toSorted((left, right) => {
  return left.localeCompare(right);
});
const reports = mkdtempSync(join(tmpdir(), REPORTS_PREFIX));
const started = performance.now();
const queue = new PQueue({ concurrency });

// Per run, the entries it hit in each file; the maps are the same in every run, so one copy of each is kept.
const hitsByTest = new Map<string, Map<string, Set<string>>>();
const maps = new Map<string, FileCoverage>();
const failed: string[] = [];
const timedOut: string[] = [];

try {
  await Promise.all(tests.map(async (test, index) => {
    return queue.add(async () => {
      const report = await coverageRun(
        root,
        relative(root, test),
        join(reports, String(index)),
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

      hitsByTest.set(test, new Map(Object.entries(report).map(([file, coverage]) => {
        maps.set(file, coverage);

        return [file, hitsOf(coverage)];
      })));
    });
  }));
}
finally {
  rmSync(reports, {
    recursive: true,
    force: true,
  });
}

const seconds = Math.round((performance.now() - started) / 1000);

// A basename where it is unique among the suites, the path where it is not: three packages have a `meta.test.ts`.
const labelOf = (test: string): string => {
  const name = basename(test);

  return tests.filter((other) => {
    return basename(other) === name;
  }).length === 1
    ? name
    : relative(root, test);
};

const sourceOf = (test: string): string => {
  return `${test.slice(0, -TEST_SUFFIX.length)}${SOURCE_SUFFIX}`;
};

const noSource = tests.filter((test) => {
  return !existsSync(sourceOf(test));
});
const outOfScope = tests.filter((test) => {
  return existsSync(sourceOf(test)) && !maps.has(sourceOf(test));
});
const paired = new Map(tests.filter((test) => {
  return maps.has(sourceOf(test));
}).map((test) => {
  return [sourceOf(test), test];
}));

// The gap of `file` against every run but its own, as the lines the report prints.
const explain = (file: string, coverage: FileCoverage, gap: string[], own?: string): string[] => {
  const others = new Map([...hitsByTest].filter(([test]) => {
    return test !== own;
  }).map(([test, hits]) => {
    return [labelOf(test), hits.get(file) ?? new Set<string>()];
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
const data: string[] = [];
let empty = 0;

for (const [file, coverage] of [...maps].toSorted(([left], [right]) => {
  return left.localeCompare(right);
})) {
  const test = paired.get(file);
  const path = relative(root, file);

  if (test === undefined) {
    if (entriesOf(coverage).length === 0) {
      empty += 1;
      continue;
    }

    if (isData(coverage)) {
      data.push(path);
      continue;
    }

    untested.push([path, ...explain(file, coverage, entriesOf(coverage))].join('\n'));
    continue;
  }

  const run = hitsByTest.get(test);

  // Its own run wrote no report, and is listed as such rather than read as covering nothing.
  if (run === undefined) {
    continue;
  }

  const own = run.get(file) ?? new Set<string>();
  const gap = gapOf(coverage, own);

  if (gap.length > 0) {
    short.push([`${path}  own ${metricsOf(coverage, own)}`, ...explain(file, coverage, gap, test)].join('\n'));
  }
}

const listed = (heading: string, items: string[]): void => {
  if (items.length > 0) {
    log(`${heading} (${String(items.length)}):\n${items.join('\n')}\n`);
  }
};

listed('Short of full coverage from their own test file', short);
listed('Sources with no test file beside them', untested);
listed('Runs that wrote no coverage report', failed.map((test) => {
  return relative(root, test);
}));
listed(`Runs killed at the ${String(timeoutSeconds)}s deadline`, timedOut.map((test) => {
  return relative(root, test);
}));
listed('Data, no function and no branch, so no suite of its own', data);
listed('Skipped, no source file beside them', noSource.map((test) => {
  return relative(root, test);
}));
listed('Out of scope, their source is outside the coverage include set', outOfScope.map((test) => {
  return relative(root, test);
}));
log(`${String(paired.size)} pairs, ${String(short.length)} short, ${String(untested.length)} untested, `
  + `${String(data.length)} data, ${String(empty)} sources with nothing to measure, `
  + `${String(timedOut.length)} timed out, ${String(noSource.length)} skipped, `
  + `${String(outOfScope.length)} out of scope; ${String(tests.length)} runs at concurrency ${String(concurrency)} `
  + `in ${String(seconds)}s`);

if (short.length > 0 || untested.length > 0 || failed.length > 0 || timedOut.length > 0) {
  process.exit(1);
}
