import {
  CONTACT,
  MOCKING_BASE,
  SOLID_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
} from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const VITE_SOLID_SUBJECTS: readonly Subject[] = [
  {
    shell: 'vite-solid',
    path: CONTACT,
    base: MOCKING_BASE,
    parameters: { './mocking': { question: 'mocking' } },
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-solid',
    path: 'src/pages/home/HomePage.test.tsx',
    base: 'vite-solid/home-page/HomePage.test.tsx',
    parameters: { './store': { question: 'store', default: 'signals' } },
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-solid',
    path: 'src/pages/home/HomePage.tsx',
    base: 'vite-solid/home-page/HomePage.tsx',
    parameters: { './store': { question: 'store', default: 'signals' } },
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-solid',
    path: 'src/pages/home/HomePage.styles.ts',
    where: { styling: 'stylex' },
    base: 'shared/home-stylex/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'signals': 'store.ts', 'tanstack-store': 'store.counter.ts' },
      },
    },
    groups: SOLID_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'vite-solid',
    path: 'src/pages/home/HomePage.styles.ts',
    where: { styling: 'css' },
    base: 'shared/home-css/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'signals': 'store.ts', 'tanstack-store': 'store.counter.ts' },
      },
    },
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
