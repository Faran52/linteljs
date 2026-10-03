import type { I18nParts } from '../types';

export const ALWAYS: readonly string[] = [
  'src/pages/index.astro',
  // Each a thin page over the status layout, so no translated twin.
  'src/pages/403.astro',
  'src/pages/404.astro',
  'src/pages/500.astro',
  'src/components/ui/mark/Mark.astro',
  'src/lib/utils/currentPathUtils.ts',
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
  'src/pages/about.astro',
  'src/pages/version.astro',
  'src/layouts/StatusLayout.astro',
  'src/components/features/app-header/AppHeader.astro',
];

// A client script over the shared locales: no library, so nothing to install.
export const ASTRO_I18N: I18nParts = { dependencies: [] };
