import { vueGroup } from '../vue/vueFramework';

import type { Layer } from '../../types';

export const nuxtGroup: string[] = [
  ...vueGroup,
  '^nuxt$',
  '^nuxt/',
  // Nuxt's own virtual modules, which resolve only inside its build.
  '^#',
];

const ROUTE_FILES = ['**/pages/**/*.vue', '**/layouts/**/*.vue', '**/app.vue', '**/error.vue'];

export const nuxt = (): Layer => {
  return [
    {
      name: '@linteljs/nuxt/route-files',
      files: ROUTE_FILES,
      rules: {
        // A page's filename is its URL.
        'vue/multi-word-component-names': 'off',
      },
    },
  ];
};

export default nuxt;
