/**
 * Checks every `v8 ignore` in src against reality. An ignore is a claim that a branch cannot be reached, and a
 * claim is not a proof: two of the first batch written here were wrong, the branch reachable and the ignore
 * hiding it, so the 100% coverage number was overstated and a live code path went untested. This removes one
 * ignore at a time and re-measures: coverage still reporting the branch uncovered means the ignore is load
 * bearing and the claim holds, coverage reporting it covered means the tests already reach it and it must go.
 *
 * Usage: node scripts/auditIgnores.ts
 */
import { execFileSync } from 'node:child_process';
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  join,
  relative,
  resolve,
} from 'node:path';

// The two counter maps v8's JSON report carries per file: statement hits keyed by id, and branch hits keyed by id
// with one count per arm. Only the zeros are read, so nothing else in the report is described.
interface FileCoverage {
  s: Record<string, number>;
  b: Record<string, number[]>;
}

// What one file's report answers: how many statements and branches the run never reached.
interface UncoveredCounts {
  statements: number;
  branches: number;
}

const root = resolve(import.meta.dirname, '..');

const isCoverageReport = (value: unknown): value is Record<string, FileCoverage> => {
  return typeof value === 'object' && value !== null;
};

const walk = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      return walk(full);
    }

    return full.endsWith('.ts') && !full.endsWith('.test.ts') ? [full] : [];
  });
};

/**
 * The count is optional, because the directive's is: `v8 ignore next` covers one line, exactly as
 * `v8 ignore next 1` does. Requiring `\d+` skipped three sites in `src` outright, so the release
 * gate below reported "every ignore is load bearing" having never looked at them.
 */
const IGNORE = /^\s*\/\* v8 ignore next(?: \d+)? -- .*\*\/\s*$/;

const coverageFor = (file: string): UncoveredCounts => {
  try {
    execFileSync('pnpm', ['exec', 'vitest', 'run', '--coverage', '--coverage.reporter=json'], {
      cwd: root,
      stdio: 'ignore',
    });
  }
  catch {
    // Removing a load-bearing ignore drops coverage below the 100% gate, so a
    // non-zero exit here is the expected path. The report is still written.
  }

  const data: unknown = JSON.parse(readFileSync(join(root, 'coverage/coverage-final.json'), 'utf8'));

  if (!isCoverageReport(data)) {
    return {
      statements: 0,
      branches: 0,
    };
  }

  const entry = Object.entries(data).find(([path]) => {
    return resolve(path) === resolve(file);
  });

  if (!entry) {
    return {
      statements: 0,
      branches: 0,
    };
  }

  const [, metrics] = entry;
  const statements = Object.values(metrics.s).filter((count) => {
    return count === 0;
  }).length;
  const branches = Object.values(metrics.b).flat().filter((count) => {
    return count === 0;
  }).length;

  return {
    statements,
    branches,
  };
};

const files = walk(join(root, 'src'));
const findings: string[] = [];
let checked = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');

  for (const [index, line] of lines.entries()) {
    if (!IGNORE.test(line)) {
      continue;
    }

    checked += 1;

    const without = [...lines.slice(0, index), ...lines.slice(index + 1)].join('\n');
    writeFileSync(file, without);

    let uncovered;

    try {
      uncovered = coverageFor(file);
    }
    finally {
      writeFileSync(file, original);
    }

    // Removing a load-bearing ignore exposes at least one uncovered spot; if nothing is exposed, the tests
    // already reach that code and the ignore claims something untrue.
    if (uncovered.statements === 0 && uncovered.branches === 0) {
      findings.push(`${relative(root, file)}:${String(index + 1)}  ${line.trim()}`);
    }
  }
}

console.log(`checked ${String(checked)} ignore directives`);

if (findings.length > 0) {
  console.error('\nThese claim a branch is unreachable, but the tests already reach it:');

  for (const finding of findings) {
    console.error(`  ${finding}`);
  }

  process.exit(1);
}

console.log('every ignore is load bearing');
