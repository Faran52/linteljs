import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
  SVELTE_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

const SVELTE_TEST = 'testing/vitest/src/routes/page.test.ts';

export const SVELTEKIT_SUBJECTS: readonly Subject[] = [
  {
    base: MOCKING_BASE,
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `sveltekit/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `sveltekit/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: 'sveltekit/routes/page.test.ts',
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.runes.ts' }, shipped: `sveltekit/store/runes/${SVELTE_TEST}` },
      { options: { './store': 'store.tanstack-store.ts' }, shipped: `sveltekit/store/tanstack-store/${SVELTE_TEST}` },
    ],
  },
  {
    base: 'sveltekit/home-view-styles/HomeView.styles.ts',
    groups: SVELTE_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.runes.ts' },
        shipped: 'sveltekit/store/runes/styling/stylex/src/views/home/HomeView.styles.ts',
      },
      {
        options: { './store': 'store.tanstack-store.ts' },
        shipped: 'sveltekit/store/tanstack-store/styling/stylex/src/views/home/HomeView.styles.ts',
      },
    ],
  },
  {
    base: 'sveltekit/home-view-css/HomeView.styles.ts',
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.runes.ts' },
        shipped: 'sveltekit/store/runes/styling/css/src/views/home/HomeView.styles.ts',
      },
      {
        options: { './store': 'store.tanstack-store.ts' },
        shipped: 'sveltekit/store/tanstack-store/styling/css/src/views/home/HomeView.styles.ts',
      },
    ],
  },
];
