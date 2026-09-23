/**
 * Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
 * repository's own, so nothing is fetched and the whole of `src/` comes from `templates/starter-source/astro/`.
 *
 * Rendered on the server and routed by the directory, so there is no entry, no router and no page switch: a link
 * is a navigation and `Astro.url` is what says where you are.
 */
export const ALWAYS: readonly string[] = [
  'src/layouts/Layout.astro',
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/version.astro',
  'src/components/ui/mark/Mark.astro',
  'src/components/features/app-header/AppHeader.astro',
  'src/lib/utils/currentPath.ts',
];

// The same bytes on every target. `routes.ts` is the nav list a file-routed target reads, and Astro takes the
// spelling with no contact page: what a form would attach to here is an island, which is its own decision.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];
