import {
  CONTACT,
  MOCKING_BASE,
  PLAIN_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const ASTRO_SUBJECTS: readonly Subject[] = [
  {
    shell: 'astro',
    path: CONTACT,
    base: MOCKING_BASE,
    parameters: { './mocking': { question: 'mocking' } },
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'astro',
    path: 'src/views/contact/ContactPage.test.tsx',
    base: 'astro/contact-page/ContactPage.test.tsx',
    parameters: { './hostedFramework': { question: 'hostedFramework' } },
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
