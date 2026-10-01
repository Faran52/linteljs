import eslintReact from '@eslint-react/eslint-plugin';
import linteljs from '@linteljs/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

import { JSX_STYLE_RULES, SCRIPT_FILES } from '../../config/constants';
import { presetOf, sonarjsRules } from '../../utils/presetUtils';

import type { Linter } from 'eslint';
import type { Layer } from '../../types';

export const reactGroup: string[] = [
  '^react$',
  '^react-dom$',
  '^react/',
  '^react-',
  '^@react',
];

// `sonarjs/recommended`'s React rules, which `base` turns off.
const REACT_SONARJS_RULES = {
  'sonarjs/jsx-no-leaked-render': 'error',
  'sonarjs/no-hook-setter-in-body': 'error',
  'sonarjs/no-useless-react-setstate': 'error',
  'sonarjs/no-uniq-key': 'error',
  'sonarjs/prefer-read-only-props': 'error',
  'sonarjs/no-debounce-throttle-in-render': 'error',
} satisfies Linter.RulesRecord;

// Its own module: importing it from `reactFramework.ts` would make React Native resolve `eslint-plugin-jsx-a11y-x`.
export const reactCore = (): Layer => {
  return [
    ...presetOf(eslintReact.configs['recommended-typescript'], 'eslint-react/typescript', SCRIPT_FILES),
    // `configs.flat.recommended`: the bare name is still the eslintrc form.
    ...presetOf(reactHooks.configs.flat.recommended, 'react-hooks/flat/recommended', SCRIPT_FILES),

    // `@eslint-react` 5 republishes these under its own prefix, so both presets reported every hook defect twice.
    // `react-hooks` stays the owner: seven of its rules, `refs` among them, have no `@eslint-react` copy.
    {
      name: '@linteljs/react/hooks-one-owner',
      files: SCRIPT_FILES,
      rules: {
        '@eslint-react/error-boundaries': 'off',
        '@eslint-react/exhaustive-deps': 'off',
        '@eslint-react/purity': 'off',
        '@eslint-react/rules-of-hooks': 'off',
        '@eslint-react/set-state-in-effect': 'off',
        '@eslint-react/set-state-in-render': 'off',
        '@eslint-react/static-components': 'off',
        '@eslint-react/unsupported-syntax': 'off',
        '@eslint-react/use-memo': 'off',
      },
    },

    ...sonarjsRules('@linteljs/react/sonarjs', REACT_SONARJS_RULES, SCRIPT_FILES),

    {
      name: '@linteljs/react',
      files: SCRIPT_FILES,
      plugins: {
        '@linteljs': linteljs,
        '@stylistic': stylistic,
      },
      rules: {
        ...JSX_STYLE_RULES,
        '@linteljs/no-duplicate-jsx-props': 'error',
        '@linteljs/prefer-destructured-props': 'error',
        '@linteljs/react-no-global-namespace': 'error',
        '@linteljs/sort-hook-dependencies': 'error',
      },
    },
  ];
};
