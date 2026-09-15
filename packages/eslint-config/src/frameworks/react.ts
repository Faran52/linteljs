import eslintReact from '@eslint-react/eslint-plugin';
import lintel from '@linteljs/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

export const reactGroup: string[] = ['^react$', '^react-dom$', '^react/', '^react-', '^@react'];

const REACT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

// `react-hooks` v7 carries the compiler diagnostics. Accessibility is a property of JSX, so it lives here, not in
// `next()`, and as the plugin's full `recommended` rather than the six rules `eslint-config-next` picked.
export const react = (): Layer => {
  return [
    ...presetOf(eslintReact.configs['recommended-typescript'], 'eslint-react/typescript', REACT_FILES),
    // `configs.flat.recommended`: the bare name is still the eslintrc form.
    ...presetOf(reactHooks.configs.flat.recommended, 'react-hooks/flat/recommended', REACT_FILES),
    ...presetOf(jsxA11y.flatConfigs.recommended, 'jsx-a11y/recommended', REACT_FILES),

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

export default react;
