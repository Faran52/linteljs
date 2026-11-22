import {
  CONTACT,
  LOCAL_MOCKING,
  MOCKING_BASE,
  MSW_MOCKING,
  PLAIN_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

const CONTACT_PAGE_TEST = 'testing/vitest/src/views/contact/ContactPage.test.tsx';

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
  {
    base: 'astro/contact-page/ContactPage.test.tsx',
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './hostedFramework': 'hostedFramework.react.tsx' },
        shipped: `astro/form/libraries/hostedFramework/react/${CONTACT_PAGE_TEST}`,
      },
      {
        options: { './hostedFramework': 'hostedFramework.solid.tsx' },
        shipped: `astro/form/tanstack-form/hostedFramework/solid/${CONTACT_PAGE_TEST}`,
      },
    ],
  },
];
