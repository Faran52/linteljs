import {
  ANGULAR_GROUPS,
  LOCAL_MOCKING,
  MSW_MOCKING,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const ANGULAR_CLI_SUBJECTS: readonly Subject[] = [
  {
    base: 'shared/contact-endpoints/contact-endpoints.spec.ts',
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: LOCAL_MOCKING,
        shipped: 'angular-cli/mocking/local/testing/vitest/src/lib/apis/contact/contact-endpoints.spec.ts',
      },
      {
        options: MSW_MOCKING,
        shipped: 'angular-cli/mocking/msw/testing/vitest/src/lib/apis/contact/contact-endpoints.spec.ts',
      },
    ],
  },
  {
    base: 'angular-cli/home/home.spec.ts',
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.ngrx-signals.ts' },
        shipped: 'angular-cli/store/ngrx-signals/testing/vitest/src/app/home/home.spec.ts',
      },
      {
        options: { './store': 'store.signals.ts' },
        shipped: 'angular-cli/store/signals/testing/vitest/src/app/home/home.spec.ts',
      },
    ],
  },
  {
    base: 'angular-cli/home-css/home.styles.ts',
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.ngrx-signals.ts' },
        shipped: 'angular-cli/store/ngrx-signals/styling/css/src/app/home/home.styles.ts',
      },
      {
        options: { './store': 'store.signals.ts' },
        shipped: 'angular-cli/store/signals/styling/css/src/app/home/home.styles.ts',
      },
    ],
  },
];
