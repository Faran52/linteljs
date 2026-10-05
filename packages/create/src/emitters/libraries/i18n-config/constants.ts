import type { Language } from '@config/types';

interface LanguageName {
  label: string;
  dir: 'ltr' | 'rtl';
}

// Each in its own script, as the switcher shows it to someone who reads that language.
export const LANGUAGE_NAMES: Record<Language, LanguageName> = {
  'en': {
    label: 'English',
    dir: 'ltr',
  },
  'ar': {
    label: 'العربية',
    dir: 'rtl',
  },
  'ja': {
    label: '日本語',
    dir: 'ltr',
  },
  'ko': {
    label: '한국어',
    dir: 'ltr',
  },
  'zh-CN': {
    label: '简体中文',
    dir: 'ltr',
  },
  'zh-TW': {
    label: '繁體中文',
    dir: 'ltr',
  },
};

// RFC 4647 lookup, which every target's detection reads: the base language alone misses `zh-TW` in `zh-TW-x-hk`.
export const LOOKUP_TAGS = [
  '// The tag, then each shorter prefix of it: `zh-TW-x-hk` reads as `zh-TW`, then `zh`.',
  'export const lookupTags = (tag: string): string[] => {',
  '  // iOS names Chinese by script, `zh-Hans-CN`: the script stands for the region the codes carry.',
  '  // Hong Kong and Macau write Traditional, as Taiwan does.',
  '  const subtags = tag',
  '    .replace(/^zh-hans\\b/iu, \'zh-CN\')',
  '    .replace(/^zh-hant\\b/iu, \'zh-TW\')',
  '    .replace(/^zh-(?:hk|mo)\\b/iu, \'zh-TW\')',
  '    .split(\'-\');',
  '',
  '  return subtags',
  '    .map((_subtag, index) => {',
  '      const kept = subtags.slice(0, subtags.length - index);',
  '',
  '      return kept.join(\'-\');',
  '    });',
  '};',
];
