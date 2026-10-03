import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

// `angular.json` carries the project's name and is emitted; this CLI emits one tsconfig.
export const ALWAYS: readonly string[] = [
  'tsconfig.app.json',
  'src/index.html',
  'src/app/app.ts',
  'src/app/app.html',
  'src/app/app.config.ts',
  'src/app/app.routes.ts',
  'src/components/ui/mark/mark.ts',
  'src/components/ui/mark/mark.html',
  'src/components/ui/button/button.ts',
  'src/components/ui/button/button.html',
  'src/components/ui/text-input/text-input.ts',
  'src/components/ui/text-input/text-input.html',
  'src/lib/providers/crash-handler/crash-handler.ts',
];

// The Contact page always ships, so its styles do too.
export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
  'src/components/features/app-header/AppHeader.css',
  'src/components/ui/mark/Mark.css',
  'src/components/ui/button/Button.css',
  'src/components/ui/text-input/TextInput.css',
  'public/favicon.svg',
  'public/robots.txt',
];

// Angular has no hooks: this runs in an injection context.
export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/services',
  query: 'extended-query',
  mutation: 'extended-mutation',
  testSuffix: '.spec.ts',
};

// Each ships a translated twin under `i18n`.
export const TRANSLATED: readonly string[] = [
  'src/main.ts',
  'src/app/home/home.ts',
  'src/app/home/home.html',
  'src/app/about/about.ts',
  'src/app/about/about.html',
  'src/app/version/version.ts',
  'src/app/version/version.html',
  'src/components/features/app-header/app-header.ts',
  'src/components/features/app-header/app-header.html',
  'src/components/features/status-page/status-page.ts',
  'src/components/features/status-page/status-page.html',
];

// A signal over the shared locales: no library, so nothing to install.
export const ANGULAR_I18N: I18nParts = { dependencies: [] };

const CODE_TEXT = 'src/components/ui/code-text/code-text';

export const I18N_ONLY_FILES = [
  'src/i18n/index.ts',
  `${CODE_TEXT}.ts`,
  `${CODE_TEXT}.html`,
];

export const I18N_ONLY_SUITES = [
  'src/i18n/index',
  CODE_TEXT,
  'src/components/features/app-header/app-header',
  'src/app/home/home',
  'src/app/about/about',
  'src/app/version/version',
];

export const TRANSLATED_SUITES = ['src/app/contact/contact', 'src/components/features/status-page/status-page'];

export const CONTACT_PAGE_FILES = ['src/app/contact/contact.ts', 'src/app/contact/contact.html'] as const;
