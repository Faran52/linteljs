import type { AnswerRecord } from '../types';

// Never asked: a fixed pair, packaged into a manifest each, so there is nothing to prompt beyond the primary
// `browser`. Hand-edited into `linteljs.config.json` when a project needs the second one.
export const browsers = {
  key: 'browsers',
  description: 'The browsers this extension is packaged for, where that is more than the one its code targets. '
    + 'Absent means just `browser`. A second manifest is emitted per extra browser, because Chrome rejects '
    + 'browser_specific_settings and AMO requires it.',
  slot: (target) => {
    return target.hostsBrowser === true;
  },
  kind: 'optionalMulti',
  minimum: 1,
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
} as const satisfies AnswerRecord;
