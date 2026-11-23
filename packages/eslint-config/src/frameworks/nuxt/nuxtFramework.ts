import { NUXT_GROUP } from '../../config/constants';

import type { Layer } from '../../types';

export const nuxtGroup: string[] = NUXT_GROUP;

const ROUTE_FILES = [
  '**/pages/**/*.vue',
  '**/layouts/**/*.vue',
  '**/app.vue',
  '**/error.vue',
];

const BUILD_OUTPUT = [
  '.nuxt/**',
  '.output/**',
  'dist/**',
];

export const nuxt = (): Layer => {
  const layer: Layer = [
    {
      name: 'linteljs/nuxt/route-files',
      files: ROUTE_FILES,
      rules: {
        // A page's filename is its URL.
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      name: 'linteljs/nuxt/ignores',
      ignores: BUILD_OUTPUT,
    },
  ];

  return layer;
};

export default nuxt;
