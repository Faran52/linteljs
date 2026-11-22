import {
  CONTACT,
  MOCKING_BASE,
  NUXT_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const NUXT_SUBJECTS: readonly Subject[] = [
  {
    shell: 'nuxt',
    path: CONTACT,
    base: MOCKING_BASE,
    parameters: { './mocking': { question: 'mocking' } },
    groups: NUXT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
