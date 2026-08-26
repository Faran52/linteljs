import lintel from '@linteljs/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import solidPlugin from 'eslint-plugin-solid';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

// Solid's bucket.
export const solidGroup: string[] = ['^solid-js$', '^solid-js/', '^@solidjs/'];

const SOLID_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

/**
 * The plugin's preset carries no `files` glob, so the layer supplies one; without it the
 * reactivity rules read as enabled on `.html` and `.css`.
 *
 * Accessibility applies here for the same reason it applies to React: Solid renders JSX, and these rules read the
 * markup rather than the framework. `eslint-plugin-solid` carries no a11y rules of its own.
 */
export const solid = (): Layer => {
  return [
    ...presetOf(solidPlugin.configs['flat/typescript'], 'solid/flat/typescript', SOLID_FILES),
    ...presetOf(jsxA11y.flatConfigs.recommended, 'jsx-a11y/recommended', SOLID_FILES),

    {
      name: '@linteljs/solid',
      files: SOLID_FILES,
      // The same plugin object `base` registers, so the two registrations are one.
      plugins: { '@linteljs': lintel },
      // Solid renders JSX, so it carries the same duplicate-prop defect React does. Its other two
      // lintel rules do not apply: hooks do not exist here and destructured props break reactivity.
      rules: { '@linteljs/no-duplicate-jsx-props': 'error' },
    },
  ];
};

export default solid;
