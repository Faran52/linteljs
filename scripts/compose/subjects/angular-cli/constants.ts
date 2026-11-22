import {
  ANGULAR_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const ANGULAR_CLI_SUBJECTS: readonly Subject[] = [
  {
    shell: 'angular-cli',
    path: 'src/lib/apis/contact/contact-endpoints.spec.ts',
    base: 'shared/contact-endpoints/contact-endpoints.spec.ts',
    parameters: { './mocking': { question: 'mocking' } },
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'angular-cli',
    path: 'src/app/home/home.spec.ts',
    base: 'angular-cli/home/home.spec.ts',
    parameters: { './store': { question: 'store', files: { signals: 'store.ts' } } },
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'angular-cli',
    path: 'src/app/home/home.styles.ts',
    where: { styling: 'css' },
    base: 'shared/home-css/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'ngrx-signals': 'store.counter.ts', 'signals': 'store.ts' },
      },
    },
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
