import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/App.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/components/features/error-boundary/ErrorBoundary.tsx',
  'src/lib/providers/store/StoreProvider.tsx',
];

export const SHARED: readonly string[] = [
  'src/lib/utils/statusUtils.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/primitives',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};

// Each ships a translated twin under `i18n`.
export const TRANSLATED: readonly string[] = [
  'src/index.tsx',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/components/features/status-page/StatusPage.tsx',
];

// Written with a language alone, without their extension, since each takes a suite.
export const I18N_ONLY: readonly string[] = [
  'src/components/features/language-select/LanguageSelect',
  'src/components/ui/code-text/CodeText',
];

// Reads the shared locales as they are, with no compiler and no provider.
export const SOLID_I18N: I18nParts = { dependencies: ['@solid-primitives/i18n'] };

const HEADER = 'src/components/features/app-header/AppHeader';

export const I18N_ONLY_SUITES = [...I18N_ONLY, HEADER];

export const FORM_FILES = [
  'src/pages/contact/create-contact-form/createContactForm.ts',
  'src/components/ui/text-input/TextInput.tsx',
] as const;
