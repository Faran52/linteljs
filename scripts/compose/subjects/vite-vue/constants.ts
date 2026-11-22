import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
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
];
