import {
  PLAIN_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const WXT_SUBJECTS: readonly Subject[] = [
  {
    shell: 'wxt',
    path: 'src/background/onInstalled.test.ts',
    base: 'wxt/background/onInstalled.test.ts',
    parameters: { './browser': { question: 'browser' } },
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'wxt',
    path: 'src/devtools/devtools.ts',
    base: 'wxt/devtools/devtools.ts',
    parameters: { './browser': { question: 'browser' } },
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'wxt',
    path: 'src/background/onInstalled.ts',
    base: 'wxt/background/onInstalled.ts',
    parameters: { './browser': { question: 'browser' } },
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
