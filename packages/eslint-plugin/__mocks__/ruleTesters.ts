import { join } from 'node:path';

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

// JSX on: prefer-arrow-functions needs it to tell a generic parameter from a JSX tag.
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

export const svelteRuleTester = new RuleTester({
  files: ['**/*.svelte'],
  languageOptions: {
    parser: svelteParser,
    parserOptions: { parser: tseslint.parser },
  },
});

export const ALIASED_PROJECT = join(import.meta.dirname, 'fixtures', 'aliased-project');

// Type-aware: `prefer-alias` reads `paths` and resolution off the program this tsconfig builds.
export const typedRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: ALIASED_PROJECT,
    },
  },
});
