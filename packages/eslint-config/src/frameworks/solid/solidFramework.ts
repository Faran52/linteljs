import linteljs from '@linteljs/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import solidPlugin from 'eslint-plugin-solid';

import { JSX_STYLE_RULES, SCRIPT_FILES } from '../../config/constants';
import { presetOf, sonarjsRules } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const solidGroup: string[] = [
  '^solid-js$',
  '^solid-js/',
  '^@solidjs/',
];

// Scoped, since the preset carries no `files` glob.
export const solid = (): Layer => {
  const layer: Layer = [
    ...presetOf(solidPlugin.configs['flat/typescript'], 'solid/flat/typescript', SCRIPT_FILES),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SCRIPT_FILES),
    ...sonarjsRules('@linteljs/solid/sonarjs', { 'sonarjs/jsx-no-leaked-render': 'error' }, SCRIPT_FILES),

    {
      name: '@linteljs/solid',
      files: SCRIPT_FILES,
      plugins: {
        '@linteljs': linteljs,
        '@stylistic': stylistic,
      },
      // Not the other two React rules: hooks do not exist here and destructured props break reactivity.
      rules: {
        ...JSX_STYLE_RULES,
        '@linteljs/no-duplicate-jsx-props': 'error',
      },
    },
  ];

  return layer;
};

export default solid;
