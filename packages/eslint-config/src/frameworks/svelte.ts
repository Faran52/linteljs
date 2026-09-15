import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

// SvelteKit's virtual modules: the sort bucket and the `no-unresolved` allowance are one set.
const VIRTUAL_MODULES = [String.raw`^\$app/`, String.raw`^\$env/`];

export const svelteGroup: string[] = ['^svelte$', '^svelte/', '^@sveltejs/', ...VIRTUAL_MODULES];

// Filenames SvelteKit owns, which no naming convention accepts.
const SVELTEKIT_ROUTE_FILES = [
  '**/routes/**/+*.svelte',
  '**/routes/**/+*.ts',
  '**/routes/**/+*.js',
  '**/service-worker.{ts,js}',
];

// `$lib` is a `svelte-kit sync` output that may not exist yet; `$app`/`$env` have no file at all.
const SVELTEKIT_VIRTUAL_MODULES = [String.raw`^\$lib/`, ...VIRTUAL_MODULES];

// After `typescript()`, like `vue()`: `svelte-eslint-parser` is top-level and nests TypeScript beneath it.
export const svelte = (): Layer => {
  return [
    ...presetOf(sveltePlugin.configs['flat/recommended'], 'svelte/flat/recommended'),

    {
      name: '@linteljs/svelte/framework-specifiers',
      rules: {
        'import-x/no-unresolved': ['error', { ignore: SVELTEKIT_VIRTUAL_MODULES }],
      },
    },

    {
      name: '@linteljs/svelte/route-filenames',
      files: SVELTEKIT_ROUTE_FILES,
      rules: {
        'check-file/filename-naming-convention': 'off',
      },
    },

    {
      name: '@linteljs/svelte',
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          extraFileExtensions: ['.svelte'],
          // As in `vue()`: the type-aware rules have no `files` glob, `projectService` does.
          projectService: true,
        },
      },
    },
  ];
};

export default svelte;
