/**
 * Decides, per surviving mutant, whether any test could ever have killed it. Mutation testing reports a survivor
 * two ways that look identical in the summary: a real gap, where the tests do not assert the behaviour, and an
 * equivalent mutant, where the change cannot alter observable behaviour at all. Only the first is a defect, and
 * telling them apart by reading the code is how false claims get written, which already happened three times
 * here with `v8 ignore`.
 *
 * So this proves it instead. Each survivor is applied to the source, the rule reloaded, and every sample in the
 * shared corpus linted with both the original and the mutant. Reports and fixed output identical everywhere means
 * no sample in this corpus distinguishes them: evidence of equivalence, not proof, since a shape the corpus lacks
 * could still tell them apart, so growing the corpus strengthens the claim. Anything that does differ is a
 * genuine gap, and the differing sample is the fixture.
 *
 * Usage: node scripts/auditSurvivors.js [ruleFileName]
 */
import {
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { FIXER_SAMPLES } from '../__mocks__/fixerSamples.ts';

const root = resolve(import.meta.dirname, '..');
const only = process.argv[2];
const report = JSON.parse(readFileSync(join(root, 'reports/mutation/mutation.json'), 'utf8'));
const linter = new Linter();
const written = [];

const languageOptionsFor = (typescript) => {
  return typescript
    ? { parser: tseslint.parser }
    : {
        ecmaVersion: 'latest',
        sourceType: 'module',
      };
};

// A named sample has to match a `files` pattern or flat config skips it; an unnamed one is `<input>`, matching none.
const filesFor = (filename) => {
  return filename ? { files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'] } : {};
};

// Everything a consumer can observe: the reports, and what `--fix` writes.
const observe = (rule, sample) => {
  const config = [
    {
      ...filesFor(sample.filename),
      plugins: { '@linteljs': { rules: { probe: rule } } },
      languageOptions: languageOptionsFor(sample.typescript ?? false),
      rules: { '@linteljs/probe': 'error' },
    },
  ];

  try {
    const messages = linter.verify(sample.code, config, sample.filename).map((message) => {
      return `${message.messageId ?? message.message}@${message.line}:${message.column}`;
    });

    return `${messages.join('|')}##${linter.verifyAndFix(sample.code, config, sample.filename).output}`;
  }
  catch (error) {
    return `threw:${String(error && error.message).slice(0, 80)}`;
  }
};

// Written beside the original, not in a temp directory: a rule imports `../types.ts` and
// `../utils/compatUtils.ts`, which only resolve from the directory the rule actually lives in.
const loadRule = async (source, tag, neighbour) => {
  const file = join(dirname(neighbour), `${tag}.generated.ts`);
  writeFileSync(file, source);
  written.push(file);

  const loaded = await import(pathToFileURL(file).href);
  const rule = Object.values(loaded).find((value) => {
    return typeof value?.create === 'function';
  });

  if (!rule) {
    throw new Error(`no rule exported from ${basename(neighbour)}`);
  }

  return rule;
};

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

let equivalent = 0;
let gaps = 0;
let counter = 0;

for (const [fileName, file] of Object.entries(report.files)) {
  const short = basename(fileName);

  if (only && short !== only) {
    continue;
  }

  // Only rule modules have observable behaviour to compare: a shared helper is covered through the rules that
  // call it, and pretending otherwise would report all its survivors as equivalent, the false result this prevents.
  if (!fileName.includes('/rules/')) {
    console.log(`\n${short}: skipped, not a rule module`);
    continue;
  }

  const survivors = file.mutants.filter((mutant) => {
    return mutant.status === 'Survived' || mutant.status === 'NoCoverage';
  });

  if (survivors.length === 0) {
    continue;
  }

  const source = file.source;
  const lines = source.split('\n');

  // Byte offset of a line/column pair, so a mutant's range can be spliced.
  const offsetOf = (position) => {
    let offset = 0;

    for (let index = 0; index < position.line - 1; index++) {
      offset += lines[index].length + 1;
    }

    return offset + position.column - 1;
  };

  const absolute = resolve(root, fileName);
  const baseline = await loadRule(source, `base-${counter++}`, absolute);
  const baselineOutput = FIXER_SAMPLES.map((sample) => {
    return observe(baseline, sample);
  });

  console.log(`\n${short}: ${survivors.length} survivors`);

  for (const mutant of survivors) {
    const mutated = spliceMutant(source, mutant, offsetOf);

    let rule;

    try {
      rule = await loadRule(mutated, `mut-${counter++}`, absolute);
    }
    catch (error) {
      // A mutant that will not even load cannot be equivalent.
      gaps += 1;
      console.log(`  GAP (load) ${mutant.location.start.line}:${mutant.location.start.column} `
        + `${mutant.mutatorName}: ${String(error && error.message).split('\n')[0].slice(0, 60)}`);
      continue;
    }

    const differs = FIXER_SAMPLES.some((sample, index) => {
      return observe(rule, sample) !== baselineOutput[index];
    });

    if (differs) {
      gaps += 1;
      console.log(`  GAP        ${mutant.location.start.line}:${mutant.location.start.column} ${mutant.mutatorName}`);
    }
    else {
      equivalent += 1;
    }
  }
}

for (const file of written) {
  rmSync(file, { force: true });
}

console.log(`\n${equivalent} indistinguishable across this corpus, ${gaps} real gaps`);

if (gaps > 0) {
  console.log('Each GAP above changes observable behaviour on some input: write a fixture for it.');
}
