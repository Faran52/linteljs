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
