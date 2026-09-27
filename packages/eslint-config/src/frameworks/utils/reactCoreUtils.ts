import eslintReact from '@eslint-react/eslint-plugin';
import linteljs from '@linteljs/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

import { SCRIPT_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const reactGroup: string[] = ['^react$', '^react-dom$', '^react/', '^react-', '^@react'];

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

    {
      name: '@linteljs/react',
      files: SCRIPT_FILES,
      plugins: { '@linteljs': linteljs },
      rules: {
        '@linteljs/no-duplicate-jsx-props': 'error',
        '@linteljs/prefer-destructured-props': 'error',
        '@linteljs/react-no-global-namespace': 'error',
        '@linteljs/sort-hook-dependencies': 'error',
      },
    },
  ];
};
