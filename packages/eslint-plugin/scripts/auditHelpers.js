/**
 * Audits surviving mutants in the shared helpers, which `auditSurvivors.js` skips. That script compares one rule
 * against its own mutated copy, which works because a rule module has observable output of its own. A helper does
 * not: `src/utils/compatUtils.ts` is imported by every rule and its behaviour is only visible through them, so
 * skipping it left its survivors as the one group never checked for a defect hiding behind them, which is how the
 * `prefer-await-to-then` computed-property bug survived.
 *
 * So this mutates the helper in place, reloads the entire rule set in a child process, and compares every rule's
 * reports and fixed output across the shared corpus. The original is restored in a `finally`, and a copy is
 * parked in the system temp directory first so an interrupted run is recoverable.
 *
 * Usage: node scripts/auditHelpers.js [helperFileName]
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

const root = resolve(import.meta.dirname, '..');
const only = process.argv[2];
const report = JSON.parse(readFileSync(join(root, 'reports/mutation/mutation.json'), 'utf8'));
const observer = join(root, 'scripts/auditHelperObserve.js');

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
const spliceMutant = (source, mutant, offsetOf) => {
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

  const offsetOf = (position) => {
    let offset = 0;

    for (let index = 0; index < position.line - 1; index++) {
      offset += lines[index].length + 1;
    }

    return offset + position.column - 1;
  };

  console.log(`\n${short}: ${survivors.length} survivors (original parked at ${parked})`);

  try {
    for (const mutant of survivors) {
      const where = `${mutant.location.start.line}:${mutant.location.start.column}`;

      writeFileSync(absolute, spliceMutant(source, mutant, offsetOf));

      let observed;

      try {
        observed = observe();
      }
      catch (error) {
        // A mutant that stops every rule from loading is not equivalent.
        gaps += 1;
        console.log(`  GAP (load) ${where} ${mutant.mutatorName}: `
          + `${String(error && error.message).split('\n')[0].slice(0, 60)}`);
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
    writeFileSync(absolute, source);
  }
}

console.log(`\n${equivalent} indistinguishable across this corpus, ${gaps} real gaps`);

if (gaps > 0) {
  console.log('Each GAP changes what some rule does on some input: write a fixture for it.');
}
