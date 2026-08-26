import eslintReact from '@eslint-react/eslint-plugin';
import lintel from '@linteljs/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

// The `simple-import-sort` bucket React owns, injected into `base({ frameworkGroup })`.
export const reactGroup: string[] = ['^react$', '^react-dom$', '^react/', '^react-', '^@react'];

const REACT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

/**
 * `eslint-plugin-react-hooks` v7 ships the compiler's diagnostics alongside the two classic
 * rules; its flat recommended preset is what enables `rules-of-hooks` here.
 *
 * Accessibility lives here rather than in `next()`, because it is a property of JSX and not of Next: an element with
 * no accessible name is the same defect in a Vite app as in a Next one, and `react-native` composes this layer too.
 * The plugin's own `recommended` preset, not a hand-picked subset: `eslint-config-next` enabled six of these rules at
 * `warn` and that was Next's choice of floor, not a standard, and every other preset in this package arrives the same
 * way. The plugin's `files` glob is absent, so this scopes it the way the layers above are scoped.
 */
export const react = (): Layer => {
  return [
    ...presetOf(eslintReact.configs['recommended-typescript'], 'eslint-react/typescript', REACT_FILES),
    // `configs.flat.recommended`, not `configs.recommended`: the bare name is still the
    // eslintrc form, which flat config rejects with "This appears to be in eslintrc format".
    ...presetOf(reactHooks.configs.flat.recommended, 'react-hooks/flat/recommended', REACT_FILES),
    ...presetOf(jsxA11y.flatConfigs.recommended, 'jsx-a11y/recommended', REACT_FILES),

    {
      name: '@linteljs/react',
      files: REACT_FILES,
      // The same plugin object `base` registers, so the two registrations are one.
      plugins: { '@linteljs': lintel },
      rules: {
        '@linteljs/no-duplicate-jsx-props': 'error',
        '@linteljs/prefer-destructured-props': 'error',
        '@linteljs/sort-hook-dependencies': 'error',
      },
    },
  ];
};

export default react;
