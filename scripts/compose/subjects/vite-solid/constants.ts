import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  SOLID_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

const SOLID = 'vite-solid/store';

const SOLID_TEST = 'testing/vitest/src/pages/home/HomePage.test.tsx';

const SOLID_PAGE = 'src/pages/home/HomePage.tsx';

export const VITE_SOLID_SUBJECTS: readonly Subject[] = [
  {
    base: MOCKING_BASE,
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `vite-solid/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `vite-solid/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: 'vite-solid/home-page/HomePage.test.tsx',
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.signals.tsx' }, shipped: `${SOLID}/signals/${SOLID_TEST}` },
      { options: { './store': 'store.tanstack-store.tsx' }, shipped: `${SOLID}/tanstack-store/${SOLID_TEST}` },
    ],
  },
  {
    base: 'vite-solid/home-page/HomePage.tsx',
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.signals.tsx' }, shipped: `${SOLID}/signals/${SOLID_PAGE}` },
      { options: { './store': 'store.tanstack-store.tsx' }, shipped: `${SOLID}/tanstack-store/${SOLID_PAGE}` },
    ],
  },
  {
    base: 'shared/home-stylex/home.styles.ts',
    groups: SOLID_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.ts' },
        shipped: 'vite-solid/store/signals/styling/stylex/src/pages/home/HomePage.styles.ts',
      },
      {
        options: { './store': 'store.counter.ts' },
        shipped: 'vite-solid/store/tanstack-store/styling/stylex/src/pages/home/HomePage.styles.ts',
      },
    ],
  },
  {
    base: 'shared/home-css/home.styles.ts',
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.ts' },
        shipped: 'vite-solid/store/signals/styling/css/src/pages/home/HomePage.styles.ts',
      },
      {
        options: { './store': 'store.counter.ts' },
        shipped: 'vite-solid/store/tanstack-store/styling/css/src/pages/home/HomePage.styles.ts',
      },
    ],
  },
];
