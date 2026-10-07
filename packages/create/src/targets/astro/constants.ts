import type { I18nParts } from '../types';

// A page names its view and nothing else, so no translated twin.
export const ALWAYS: readonly string[] = [
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/version.astro',
  'src/pages/403.astro',
  'src/pages/404.astro',
  'src/pages/500.astro',
  'src/components/ui/mark/Mark.astro',
  'src/lib/utils/currentPathUtils.ts',
  'src/typings/astro.d.ts',
];

// Astro takes the spelling with no contact page: a form here would be an island, its own decision.
export const SHARED: readonly string[] = [
  'src/config/routes.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

// Each ships a translated twin under `i18n`.
export const TRANSLATED: readonly string[] = [
  'src/views/home/HomeView.astro',
  'src/views/about/AboutView.astro',
  'src/views/version/VersionView.astro',
  'src/views/status/StatusView.astro',
  'src/components/features/app-header/AppHeader.astro',
];

// One suite covers both spellings of its view.
export const VIEW_SUITES: readonly string[] = [
  'src/views/home/HomeView',
  'src/views/about/AboutView',
  'src/views/version/VersionView',
  'src/views/status/StatusView',
];

// A client script over the shared locales: no library, so nothing to install.
export const ASTRO_I18N: I18nParts = { dependencies: [] };
