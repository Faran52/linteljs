/**
 * Audits surviving mutants in the shared helpers, which `auditSurvivors.ts` skips. That script compares one rule
 * against its own mutated copy, which works because a rule module has observable output of its own. A helper does
 * not: `src/utils/compatUtils.ts` is imported by every rule and its behaviour is only visible through them, so
 * skipping it left its survivors as the one group never checked for a defect hiding behind them, which is how the
 * `prefer-await-to-then` computed-property bug survived.
 *
 * So this mutates the helper in place, reloads the entire rule set in a child process, and compares every rule's
 * reports and fixed output across the shared corpus. The original is restored in a `finally`, and a copy is
 * parked in the system temp directory first so an interrupted run is recoverable.
 *
 * Usage: node scripts/auditHelpers.ts [helperFileName]
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  basename,
  join,
  resolve,
} from 'node:path';

/**
 * The slice of Stryker's JSON report this reads. Declared here rather than imported from
 * `mutation-testing-report-schema`: that package is a transitive of Stryker rather than a dependency of this one,
 * and `package.json` must not grow a runtime dependency for an audit script's type.
 */
interface MutantPosition {
  line: number;
  column: number;
}

interface MutantLocation {
  start: MutantPosition;
  end: MutantPosition;
}

interface Mutant {
  status: string;
  mutatorName: string;
  replacement?: string;
  location: MutantLocation;
}

interface MutatedFile {
  source: string;
  mutants: Mutant[];
}

interface MutationReport {
  files: Record<string, MutatedFile>;
}

const isMutationReport = (value: unknown): value is MutationReport => {
  return typeof value === 'object' && value !== null && 'files' in value;
};

const root = resolve(import.meta.dirname, '..');
const only = process.argv[2];
const parsed: unknown = JSON.parse(readFileSync(join(root, 'reports/mutation/mutation.json'), 'utf8'));

if (!isMutationReport(parsed)) {
  throw new Error('reports/mutation/mutation.json has no `files`: run `pnpm mutation` first');
}

const report = parsed;
const observer = join(root, 'scripts/auditHelperObserve.ts');

const observe = () => {
  return execFileSync(process.execPath, [observer], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
};

const helpers = Object.entries(report.files).filter(([fileName]) => {
  return !fileName.includes('/rules/') && (!only || basename(fileName) === only);
});

if (helpers.length === 0) {
  console.log('no helper files in the report');
  process.exit(0);
}

/**
 * Splices a mutant into the source the way Stryker applies it. Stryker swaps an AST node, so a replaced
 * sub-expression stays one node and keeps its grouping; pasting the replacement in as raw text throws that away:
 * `a && b` inside `a && b && c` becomes `a || b && c`, and `&&` binding tighter than `||` silently makes it a
 * different program, which reported an equivalent mutant as a real defect until the parentheses were put back. A
 * replacement that is a block or a statement is pasted as-is, since wrapping one in parentheses would not parse.
 */
const spliceMutant = (source: string, mutant: Mutant, offsetOf: (position: MutantPosition) => number): string => {
  const start = offsetOf(mutant.location.start);
  const end = offsetOf(mutant.location.end);
  const replacement = mutant.replacement ?? '';
  const grouped = replacement.trimStart().startsWith('{')
    ? replacement
    : `(${replacement})`;

  return source.slice(0, start) + grouped + source.slice(end);
};

const baseline = observe();
let equivalent = 0;
let gaps = 0;

for (const [fileName, file] of helpers) {
  const short = basename(fileName);
  const survivors = file.mutants.filter((mutant) => {
    return mutant.status === 'Survived' || mutant.status === 'NoCoverage';
  });

  if (survivors.length === 0) {
    continue;
  }

  const absolute = resolve(root, fileName);
  const source = file.source;
  const lines = source.split('\n');

  const parked = join(mkdtempSync(join(tmpdir(), 'linteljs-audit-')), short);
  copyFileSync(absolute, parked);

  const offsetOf = (position: MutantPosition): number => {
    let offset = 0;

    for (const line of lines.slice(0, position.line - 1)) {
      offset += line.length + 1;
    }

    return offset + position.column - 1;
  };

  console.log(`\n${short}: ${String(survivors.length)} survivors (original parked at ${parked})`);

  try {
    for (const mutant of survivors) {
      const where = `${String(mutant.location.start.line)}:${String(mutant.location.start.column)}`;

      writeFileSync(absolute, spliceMutant(source, mutant, offsetOf));

      let observed: string;

      try {
        observed = observe();
      }
      catch (error) {
        // A mutant that stops every rule from loading is not equivalent.
        gaps += 1;

        const message = error instanceof Error ? error.message : String(error);

        console.log(`  GAP (load) ${where} ${mutant.mutatorName}: `
          + (message.split('\n')[0]?.slice(0, 60) ?? ''));
        continue;
      }

      if (observed === baseline) {
        equivalent += 1;
      }
      else {
        gaps += 1;
        const shown = JSON.stringify(mutant.replacement ?? '').slice(0, 50);

        console.log(`  GAP        ${where} ${mutant.mutatorName} => ${shown}`);
      }
    }
  }
  finally {
    /**
     * The parked copy, not `source`. `source` is the text the report was generated from, so restoring that
     * overwrites whatever the file says now with whatever it said when `pnpm mutation` last ran. A stale report
     * and an edited helper is the ordinary case, and it cost three files the first time this was run after one.
     */
    copyFileSync(parked, absolute);
  }
}

console.log(`\n${String(equivalent)} indistinguishable across this corpus, ${String(gaps)} real gaps`);

if (gaps > 0) {
  console.log('Each GAP changes what some rule does on some input: write a fixture for it.');
}
