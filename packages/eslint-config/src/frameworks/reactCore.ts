import eslintReact from '@eslint-react/eslint-plugin';
import lintel from '@linteljs/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

export const reactGroup: string[] = ['^react$', '^react-dom$', '^react/', '^react-', '^@react'];

export const REACT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

/**
 * Everything React that assumes no DOM, in its own module rather than in `react.ts`. A module-scope import runs when
 * the module loads, so composing this from `react.ts` would make a React Native project resolve
 * `eslint-plugin-jsx-a11y-x`, which it no longer installs, and ESLint would die on ERR_MODULE_NOT_FOUND before
 * reading a rule. Measured end to end on all four package managers.
 */
export const reactCore = (): Layer => {
  return [
    ...presetOf(eslintReact.configs['recommended-typescript'], 'eslint-react/typescript', REACT_FILES),
    // `configs.flat.recommended`: the bare name is still the eslintrc form.
    ...presetOf(reactHooks.configs.flat.recommended, 'react-hooks/flat/recommended', REACT_FILES),

    {
      name: '@linteljs/react',
      files: REACT_FILES,
      plugins: { '@linteljs': lintel },
      rules: {
        '@linteljs/no-duplicate-jsx-props': 'error',
        '@linteljs/prefer-destructured-props': 'error',
        '@linteljs/sort-hook-dependencies': 'error',
      },
    },
  ];
};
