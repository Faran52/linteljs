import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  NUXT_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const NUXT_SUBJECTS: readonly Subject[] = [
  {
    base: MOCKING_BASE,
    groups: NUXT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `nuxt/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `nuxt/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
];
