import type { AnswerRecord } from '../../types';

export type Browser = keyof typeof browserAnswer.values;

export const browserAnswer = {
  key: 'browser',
  flag: 'browser',
  prompt: 'Browser',
  note: 'webextension only',
  slot: (target) => {
    return target.hostsBrowser === true;
  },
  kind: 'choice',
  values: {
    chrome: {
      label: 'Chrome',
      hint: 'MV3 service worker',
    },
    firefox: {
      label: 'Firefox',
      hint: 'MV3 event page, loaded from about:debugging',
    },
  },
  default: 'chrome',
} as const satisfies AnswerRecord;
