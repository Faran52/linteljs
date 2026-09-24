/**
 * Checks every `v8 ignore` in the packages' source against reality. An ignore claims a branch cannot be reached,
 * and two of the first ones written here were wrong, overstating coverage and hiding a live path. Each is removed in
 * turn and its file re-measured under its own package's suite: still uncovered means the claim holds.
 *
 * Usage: node scripts/auditIgnores.ts
 */
import { execFileSync } from 'node:child_process';
import {
  globSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  join,
  relative,
  resolve,
} from 'node:path';
import process from 'node:process';

import { log, logError } from './utils/loggerUtils.ts';

// The two counter maps v8's JSON report carries per file. Only the zeros are read.
interface FileCoverage {
  s: Record<string, number>;
  b: Record<string, number[]>;
}

// The count and the reason are both optional, as they are in the directive.
const IGNORE = /^\s*\/\* v8 ignore next(?: \d+)?(?: -- .*)? \*\/\s*$/;

const isCoverageReport = (value: unknown): value is Record<string, FileCoverage> => {
  return typeof value === 'object' && value !== null;
};

const reports = mkdtempSync(join(tmpdir(), 'linteljs-ignores-'));

// Uncovered statements plus branch arms in `file`, measured under its own package's suite alone.
const uncoveredIn = (file: string): number => {
  const packageDir = resolve(file.split('/src/')[0] ?? '.');

  try {
    execFileSync('pnpm', [
      'exec',
      'vitest',
      'run',
      '--coverage.enabled',
      '--coverage.provider=v8',
      '--coverage.reporter=json',
      `--coverage.reportsDirectory=${reports}`,
      `--coverage.include=${relative(packageDir, file)}`,
    ], {
      cwd: packageDir,
      stdio: 'ignore',
    });
  }
  catch {
    // A failing suite still writes its report, and the count below is what decides.
  }

  const data: unknown = JSON.parse(readFileSync(join(reports, 'coverage-final.json'), 'utf8'));
  const metrics = isCoverageReport(data) ? data[resolve(file)] : undefined;

  if (metrics === undefined) {
    throw new Error(`no coverage recorded for ${file}`);
  }

  return [...Object.values(metrics.s), ...Object.values(metrics.b).flat()].filter((count) => {
    return count === 0;
  }).length;
};

const findings: string[] = [];
let checked = 0;

try {
  for (const file of globSync('packages/*/src/**/*.ts').filter((path) => {
    return !path.endsWith('.test.ts');
  })) {
    const original = readFileSync(file, 'utf8');
    const lines = original.split('\n');

    for (const [index, line] of lines.entries()) {
      if (!IGNORE.test(line)) {
        continue;
      }

      checked += 1;
      writeFileSync(file, lines.toSpliced(index, 1).join('\n'));

      try {
        if (uncoveredIn(file) === 0) {
          findings.push(`${file}:${String(index + 1)}  ${line.trim()}`);
        }
      }
      finally {
        writeFileSync(file, original);
      }
    }
  }
}
finally {
  rmSync(reports, {
    recursive: true,
    force: true,
  });
}

log(`checked ${String(checked)} ignore directives`);

if (findings.length > 0) {
  logError(`These claim a branch is unreachable, but the tests already reach it:\n  ${findings.join('\n  ')}`);
  process.exit(1);
}

log('every ignore is load bearing');
