import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// No file behind it, so the resolver has nothing to find.
const VIRTUAL_MODULES = [String.raw`^\$app/`];

export const svelteGroup: string[] = [
  '^svelte$',
  '^svelte/',
  '^@sveltejs/',
  ...VIRTUAL_MODULES,
  '^#lib(?:/|$)',
];

const SVELTEKIT_ROUTE_FILES = [
  '**/routes/**/+*.svelte',
  '**/routes/**/+*.ts',
  '**/routes/**/+*.js',
  '**/service-worker.{ts,js}',
];

const SVELTE_EXTENSION = '.svelte';

// After `typescript()`, like `vue()`: `svelte-eslint-parser` is top-level and nests TypeScript beneath it.
export const svelte = (): Layer => {
  const layer: Layer = [
    ...presetOf(sveltePlugin.configs['flat/recommended'], 'svelte/flat/recommended'),

    {
      name: '@linteljs/svelte/framework-specifiers',
      rules: {
        'import-x/no-unresolved': ['error', { ignore: VIRTUAL_MODULES }],
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
      // Not `.svelte.js`: `typescript()` turns type-aware rules off every `.js` file.
      files: [`**/*${SVELTE_EXTENSION}`, `**/*${SVELTE_EXTENSION}.ts`],
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          extraFileExtensions: [SVELTE_EXTENSION],
          // As in `vue()`: the type-aware rules have no `files` glob, `projectService` does.
          projectService: true,
        },
      },
    },
  ];

  return layer;
};

export default svelte;
