import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
  VUE_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const VITE_VUE_SUBJECTS: readonly Subject[] = [
  {
    base: MOCKING_BASE,
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `vite-vue/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `vite-vue/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: 'vite-vue/home-view/HomeView.test.ts',
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: 'vite-vue/store/libraries/testing/vitest/src/views/home/HomeView.test.ts',
      },
      {
        options: { './store': 'store.vue-reactivity.ts' },
        shipped: 'vite-vue/store/vue-reactivity/testing/vitest/src/views/home/HomeView.test.ts',
      },
    ],
  },
  {
    base: 'vite-vue/home-view-styles/HomeView.styles.ts',
    groups: VUE_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: 'vite-vue/store/libraries/styling/stylex/src/views/home/HomeView.styles.ts',
      },
      {
        options: { './store': 'store.vue-reactivity.ts' },
        shipped: 'vite-vue/store/vue-reactivity/styling/stylex/src/views/home/HomeView.styles.ts',
      },
    ],
  },
  {
    base: 'vite-vue/home-view-css/HomeView.styles.ts',
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: 'vite-vue/store/libraries/styling/css/src/views/home/HomeView.styles.ts',
      },
      {
        options: { './store': 'store.vue-reactivity.ts' },
        shipped: 'vite-vue/store/vue-reactivity/styling/css/src/views/home/HomeView.styles.ts',
      },
    ],
  },
];
