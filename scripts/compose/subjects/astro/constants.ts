import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  PLAIN_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const ASTRO_SUBJECTS: readonly Subject[] = [
  {
    base: MOCKING_BASE,
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `astro/form/libraries/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `astro/form/libraries/mocking/msw/${CONTACT}` },
    ],
  },
];
