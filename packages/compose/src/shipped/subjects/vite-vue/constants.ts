import {
  CONTACT,
  MOCKING_BASE,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
  VUE_GROUPS,
} from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const VITE_VUE_SUBJECTS: readonly Subject[] = [
  {
    shell: 'vite-vue',
    path: CONTACT,
    base: MOCKING_BASE,
    parameters: { './mocking': { question: 'mocking' } },
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-vue',
    path: 'src/views/home/HomeView.test.ts',
    base: 'vite-vue/home-view/HomeView.test.ts',
    parameters: { './store': { question: 'store' } },
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-vue',
    path: 'src/views/home/HomeView.styles.ts',
    where: { styling: 'stylex' },
    base: 'shared/home-stylex/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'libraries': 'store.counter.ts', 'vue-reactivity': 'store.ts' },
      },
    },
    groups: VUE_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'vite-vue',
    path: 'src/views/home/HomeView.styles.ts',
    where: { styling: 'css' },
    base: 'shared/home-css/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'libraries': 'store.counter.ts', 'vue-reactivity': 'store.ts' },
      },
    },
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
