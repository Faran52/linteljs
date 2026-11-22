import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
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
];
