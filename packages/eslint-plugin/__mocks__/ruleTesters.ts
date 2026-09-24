import { RuleTester } from 'eslint';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

export const jsRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

export const tsRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

// TypeScript with JSX enabled: prefer-arrow-functions needs this to disambiguate a generic
// parameter from a JSX tag, and prefer-destructured-props for its JSX fixtures.
export const tsxRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

// A `.svelte` file, whose `Program.body` holds each `<script>` as an element with its statements beneath it.
export const svelteRuleTester = new RuleTester({
  files: ['**/*.svelte'],
  languageOptions: {
    parser: svelteParser,
    parserOptions: { parser: tseslint.parser },
  },
});
