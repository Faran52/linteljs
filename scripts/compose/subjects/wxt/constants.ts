import {
  PLAIN_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

const BACKGROUND_TEST = 'surfaces/background/testing/vitest/src/background/onInstalled.test.ts';

const DEVTOOLS = 'surfaces/devtools-panel/src/devtools/devtools.ts';

export const WXT_SUBJECTS: readonly Subject[] = [
  {
    base: 'wxt/background/onInstalled.test.ts',
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './browser': 'browser.chrome.ts' }, shipped: `wxt/browser/chrome/${BACKGROUND_TEST}` },
      { options: { './browser': 'browser.firefox.ts' }, shipped: `wxt/browser/firefox/${BACKGROUND_TEST}` },
    ],
  },
  {
    base: 'wxt/devtools/devtools.ts',
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './browser': 'browser.chrome.ts' }, shipped: `wxt/browser/chrome/${DEVTOOLS}` },
      { options: { './browser': 'browser.firefox.ts' }, shipped: `wxt/browser/firefox/${DEVTOOLS}` },
    ],
  },
];
