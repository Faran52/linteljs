import { vueGroup } from './vue';

import type { Layer } from '../types';

/*
 * Stacks on `vue()`, the way `next()` stacks on `react()`. Nuxt ships no ESLint plugin of its own that this
 * standard wants: `@nuxt/eslint` bundles a formatter and a flat-config builder, both of which this repository
 * already answers. What is left is the two conventions its build imposes, and those are here.
 */
export const nuxtGroup: string[] = [
  ...vueGroup,
  '^nuxt$',
  '^nuxt/',
  // Nuxt's own virtual modules, which resolve only inside its build.
  '^#',
];

// A page is its filename and a layout is its filename, so both are single words by convention rather than by lapse.
const ROUTE_FILES = ['**/pages/**/*.vue', '**/layouts/**/*.vue', '**/app.vue', '**/error.vue'];

export const nuxt = (): Layer => {
  return [
    {
      name: '@linteljs/nuxt/route-files',
      files: ROUTE_FILES,
      rules: {
        /*
         * A page's filename is its URL. `pages/index.vue` is `/` and `pages/about.vue` is `/about`, so the name
         * is decided by the router rather than chosen, and the rule has nothing to improve.
         */
        'vue/multi-word-component-names': 'off',
      },
    },
  ];
};

export default nuxt;
