import eslintReact from '@eslint-react/eslint-plugin';
import linteljs from '@linteljs/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

import { SCRIPT_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const reactGroup: string[] = ['^react$', '^react-dom$', '^react/', '^react-', '^@react'];

/**
 * Everything React that assumes no DOM, in its own module rather than in `reactFramework.ts`. A module-scope import
 * runs when the module loads, so composing this from `reactFramework.ts` would make a React Native project resolve
 * `eslint-plugin-jsx-a11y-x`, which it does not install, and ESLint would die on ERR_MODULE_NOT_FOUND before
 * reading a rule. Measured end to end on all four package managers.
 */
export const reactCore = (): Layer => {
  return [
    ...presetOf(eslintReact.configs['recommended-typescript'], 'eslint-react/typescript', SCRIPT_FILES),
    // `configs.flat.recommended`: the bare name is still the eslintrc form.
    ...presetOf(reactHooks.configs.flat.recommended, 'react-hooks/flat/recommended', SCRIPT_FILES),

    /**
     * `@eslint-react` 5 republishes the `react-hooks` 7 rule set under its own prefix, so composing both presets
     * enabled these nine twice and reported every hook defect on two lines with two different wordings. Measured:
     * 535 rules on for a `.tsx` file, 12 names enabled under two ids.
     *
     * `eslint-plugin-react-hooks` is the owner rather than the other way round, which is the opposite of the
     * obvious saving. Dropping its preset takes 16 rules off, and seven of those have no `@eslint-react` copy at
     * any preset level: `config`, `gating`, `globals`, `immutability`, `incompatible-library`,
     * `preserve-manual-memoization` and `refs`. Four are React Compiler rules and every React target this
     * workspace scaffolds turns the compiler on, and `react-state.md` names `react-hooks/refs` as the rule
     * enforcing its own published standard.
     */
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
