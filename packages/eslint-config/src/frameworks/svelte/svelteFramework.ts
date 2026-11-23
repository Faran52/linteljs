import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

import { SVELTE_GROUP, SVELTE_VIRTUAL_MODULES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const svelteGroup: string[] = SVELTE_GROUP;

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
      name: 'linteljs/svelte/framework-specifiers',
      rules: {
        'import-x/no-unresolved': ['error', { ignore: SVELTE_VIRTUAL_MODULES }],
      },
    },

    {
      name: 'linteljs/svelte/route-filenames',
      files: SVELTEKIT_ROUTE_FILES,
      rules: {
        'check-file/filename-naming-convention': 'off',
      },
    },

    {
      name: 'linteljs/svelte/rules',
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
