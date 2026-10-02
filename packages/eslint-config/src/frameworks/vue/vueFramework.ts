import vuePlugin from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import tseslint from 'typescript-eslint';

import { SCRIPT_AND_SFC_FILES } from '../../config/constants';
import { presetOf, sonarjsRules } from '../../utils/presetUtils';

import type { Linter } from 'eslint';
import type { Layer } from '../../types';

export const vueGroup: string[] = [
  '^vue$',
  '^vue-router$',
  '^pinia$',
  '^@vue/',
];

const VUE_EXTENSION = '.vue';

const VUE_FILES = [`**/*${VUE_EXTENSION}`];

const VUE_SONARJS_RULES = {
  'sonarjs/no-vue-class-component': 'error',
  'sonarjs/no-vue-mixins': 'error',
  'sonarjs/no-mutate-reactive-state-in-updated-hook': 'error',
} satisfies Linter.RulesRecord;

// After `typescript()`: `vue-eslint-parser` is the top-level SFC parser, and placed earlier it is overwritten.
export const vue = (): Layer => {
  const layer: Layer = [
    ...presetOf(vuePlugin.configs['flat/recommended'], 'vue/flat/recommended'),

    // Ahead of the block below: the preset sets its own parser, and later it would drop `projectService`.
    ...presetOf(vueA11y.configs['flat/recommended'], 'vuejs-accessibility/flat/recommended', VUE_FILES),

    {
      name: '@linteljs/vue',
      files: VUE_FILES,
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          extraFileExtensions: [VUE_EXTENSION],
          // `typescript()` scopes `projectService` to `.ts`; see `sfc-import-seam` below.
          projectService: true,
        },
      },
      rules: {
        // `for` alone: demanding nesting too rules out any layout with an error message between label and control.
        'vuejs-accessibility/label-has-for': ['error', { required: { every: ['id'] } }],
      },
    },

    // `sonarjs/recommended`'s Vue rules, which `base` turns off.
    ...sonarjsRules('@linteljs/vue/sonarjs', VUE_SONARJS_RULES, SCRIPT_AND_SFC_FILES),

    {
      // `vue-tsc --noEmit` covers SFC imports. Measured: `@vue/typescript-plugin` trades 2 findings for 376.
      name: '@linteljs/vue/sfc-import-seam',
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },

  ];

  return layer;
};

export default vue;
