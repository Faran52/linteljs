import type { Language } from '@config/types';
import type { OptionalMultiRecord } from '../../types';

export const languagesAnswer = {
  key: 'languages',
  flag: 'languages',
  prompt: 'Languages',
  description: 'Translates the starter and adds a language switcher; English ships with any choice.',
  slot: (target) => {
    return target.i18n !== undefined;
  },
  kind: 'optionalMulti',
  skippable: true,
  values: {
    'en': { label: 'English' },
    'ar': {
      label: 'Arabic',
      hint: 'Right to left',
    },
    'ja': { label: 'Japanese' },
    'ko': { label: 'Korean' },
    'zh-CN': { label: 'Chinese, Simplified' },
    'zh-TW': { label: 'Chinese, Traditional' },
  },
} as const satisfies OptionalMultiRecord<Language>;
