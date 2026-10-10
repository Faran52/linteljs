import linteljs from '@linteljs/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import solidPlugin from 'eslint-plugin-solid';

import {
  JS_MARKUP_FILES,
  JSX_STYLE_RULES,
  SCRIPT_FILES,
} from '../../config/constants';
import { presetOf, sonarjsRules } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const solidGroup: string[] = [
  '^solid-js$',
  '^solid-js/',
  '^@solidjs/',
];

// Scoped, since the preset carries no `files` glob.
const BUILD_OUTPUT = ['dist/**'];

export const solid = (): Layer => {
  const layer: Layer = [
    ...presetOf(solidPlugin.configs['flat/typescript'], 'solid/flat/typescript', SCRIPT_FILES),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SCRIPT_FILES),
    ...sonarjsRules('linteljs/solid/sonarjs', { 'sonarjs/jsx-no-leaked-render': 'error' }, SCRIPT_FILES),

    {
      name: 'linteljs/solid/rules',
      files: SCRIPT_FILES,
      plugins: {
        '@linteljs': linteljs,
        '@stylistic': stylistic,
      },
      // Not the other two React rules: hooks do not exist here and destructured props break reactivity.
      rules: JSX_STYLE_RULES,
    },
    // tsc reports a duplicate JSX prop in `.tsx` as TS17001.
    {
      name: 'linteljs/solid/javascript',
      files: JS_MARKUP_FILES,
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      rules: { '@linteljs/no-duplicate-jsx-props': 'error' },
    },
    {
      name: 'linteljs/solid/ignores',
      ignores: BUILD_OUTPUT,
    },
  ];

  return layer;
};

export default solid;
