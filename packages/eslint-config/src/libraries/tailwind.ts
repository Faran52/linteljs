import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';
import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

const TAILWIND_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];

// Class order, duplicates and conflicts. Without `entryPoint` every theme rule warns once per class string.
export const tailwind = (entryPoint?: string): Layer => {
  return [
    ...presetOf(betterTailwindcss.configs.recommended, 'better-tailwindcss/recommended', TAILWIND_FILES),
    {
      name: '@linteljs/tailwind',
      files: TAILWIND_FILES,
      ...(entryPoint === undefined ? {} : { settings: { 'better-tailwindcss': { entryPoint } } }),
      rules: {
        // create-vite's own template classes trip it. Measured.
        'better-tailwindcss/no-unknown-classes': 'off',
      },
    },
  ];
};

export default tailwind;
