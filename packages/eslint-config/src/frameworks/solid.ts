import lintel from '@linteljs/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import solidPlugin from 'eslint-plugin-solid';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

export const solidGroup: string[] = ['^solid-js$', '^solid-js/', '^@solidjs/'];

const SOLID_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

// Scoped, since the preset carries no `files` glob; `eslint-plugin-solid` has no a11y rules of its own.
export const solid = (): Layer => {
  return [
    ...presetOf(solidPlugin.configs['flat/typescript'], 'solid/flat/typescript', SOLID_FILES),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SOLID_FILES),

    {
      name: '@linteljs/solid',
      files: SOLID_FILES,
      plugins: { '@linteljs': lintel },
      // Not the other two React rules: hooks do not exist here and destructured props break reactivity.
      rules: { '@linteljs/no-duplicate-jsx-props': 'error' },
    },
  ];
};

export default solid;
