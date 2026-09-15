import vuePlugin from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import tseslint from 'typescript-eslint';

import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

export const vueGroup: string[] = ['^vue$', '^vue-router$', '^pinia$', '^@vue/'];

const VUE_FILES = ['**/*.vue'];

// After `typescript()`: `vue-eslint-parser` is the top-level SFC parser, and placed earlier it is overwritten.
export const vue = (): Layer => {
  return [
    ...presetOf(vuePlugin.configs['flat/recommended'], 'vue/flat/recommended'),

    // `eslint-plugin-vue` has no accessibility rule. Ahead of the block below: the preset sets its own parser and
    // placed later would drop the `projectService` there.
    ...presetOf(vueA11y.configs['flat/recommended'], 'vuejs-accessibility/flat/recommended', VUE_FILES),

    {
      name: '@linteljs/vue',
      files: VUE_FILES,
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          extraFileExtensions: ['.vue'],
          // `typescript()` scopes `projectService` to `.ts`, while `strictTypeChecked` enables its rules everywhere.
          // No `loadTypeScriptPlugins`; see `sfc-import-seam` below.
          projectService: true,
        },
      },
      rules: {
        'vue/multi-word-component-names': 'error',
      },
    },

    {
      // An SFC import has no type for typescript-eslint; `vue-tsc --noEmit` covers these two. Measured alternatives:
      // `@vue/typescript-plugin` trades 2 findings for 376, `declare module '*.vue'` types every SFC as `any`.
      name: '@linteljs/vue/sfc-import-seam',
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },

  ];
};

export default vue;
