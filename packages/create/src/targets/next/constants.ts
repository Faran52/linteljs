import type { I18nParts } from '../types';

export const ALWAYS: readonly string[] = [
  'next.config.ts',
  'src/app/not-found.tsx',
  'src/app/error.tsx',
];

// Each ships a translated twin.
export const TRANSLATED: readonly string[] = [
  'src/app/layout.tsx',
  'src/app/global-error.tsx',
  'src/app/about/page.tsx',
  'src/app/version/page.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
];

// Suites without their extension, since each ships a translated twin.
export const TRANSLATED_SUITES: readonly string[] = [
  'src/app/about/page',
  'src/app/version/page',
  'src/app/contact/page',
  'src/app/not-found',
  'src/app/error',
  'src/components/features/app-header/AppHeader',
];

export const STATUS_PAGE = 'src/components/features/status-page/StatusPage';

// Written with a language alone, without their extension, since each takes a suite.
export const I18N_ONLY: readonly string[] = [
  'src/components/features/language-select/LanguageSelect',
  'src/lib/providers/i18n/I18nProvider',
];

export const SHARED: readonly string[] = [
  'src/lib/utils/statusUtils.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

export const FROM_REACT: readonly string[] = [
  'src/components/ui/mark/Mark.tsx',
];

export { REACT_ACCESSORS as ACCESSORS } from '../react/constants';

// next-intl, as Next's own i18n serves the Pages Router alone.
export const NEXT_I18N: I18nParts = { dependencies: ['next-intl'] };
