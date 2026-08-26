/**
 * Prints what every rule does to the shared corpus, as one JSON blob. Runs as a child process so
 * `scripts/auditHelpers.js` gets a clean module graph per mutant: a shared helper is imported by every rule, and
 * once Node has resolved it the module is cached for the life of the process, so swapping the file under a
 * running process would measure the old code.
 */
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { FIXER_SAMPLES } from '../__mocks__/fixerSamples.ts';
import { rules } from '../src/rules/index.ts';

const linter = new Linter();

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

const observations = [];

for (const [name, rule] of Object.entries(rules)) {
  for (const sample of FIXER_SAMPLES) {
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

      const { output } = linter.verifyAndFix(sample.code, config, sample.filename);

      observations.push(`${name}|${sample.name}|${messages.join(',')}|${output}`);
    }
    catch (error) {
      observations.push(`${name}|${sample.name}|threw:${String(error && error.message).slice(0, 80)}`);
    }
  }
}

process.stdout.write(JSON.stringify(observations));
