export const ALWAYS: readonly string[] = [
  'src/layouts/Layout.astro',
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/version.astro',
  'src/pages/404.astro',
  'src/components/ui/mark/Mark.astro',
  'src/components/features/app-header/AppHeader.astro',
  'src/lib/utils/currentPathUtils.ts',
];

// Astro takes the spelling with no contact page: a form here would be an island, its own decision.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
  'src/config/statuses.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
];
