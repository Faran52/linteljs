import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

import { SCRIPT_AND_SFC_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// Without `entryPoint` every theme rule warns once per class string.
export const tailwind = (entryPoint?: string): Layer => {
  return [
    ...presetOf(betterTailwindcss.configs.recommended, 'better-tailwindcss/recommended', SCRIPT_AND_SFC_FILES),
    {
      name: '@linteljs/tailwind',
      files: SCRIPT_AND_SFC_FILES,
      ...(entryPoint === undefined ? {} : { settings: { 'better-tailwindcss': { entryPoint } } }),
      rules: {
        // create-vite's own template classes trip it. Measured.
        'better-tailwindcss/no-unknown-classes': 'off',
      },
    },
  ];
};

export default tailwind;
