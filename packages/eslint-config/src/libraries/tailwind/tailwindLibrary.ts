import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

import { SCRIPT_AND_SFC_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// `.astro` named here, as in `stylex()`: only an Astro project has one to lint.
const TAILWIND_FILES = [...SCRIPT_AND_SFC_FILES, '**/*.astro'];

// Without `entryPoint` every theme rule warns once per class string.
export const tailwind = (entryPoint?: string): Layer => {
  const layer: Layer = [
    ...presetOf(betterTailwindcss.configs.recommended, 'better-tailwindcss/recommended', TAILWIND_FILES),
    {
      name: '@linteljs/tailwind',
      files: TAILWIND_FILES,
      ...(entryPoint === undefined ? {} : { settings: { 'better-tailwindcss': { entryPoint } } }),
      rules: {
        // create-vite's own template classes trip it.
        'better-tailwindcss/no-unknown-classes': 'off',
      },
    },
  ];

  return layer;
};

export default tailwind;
