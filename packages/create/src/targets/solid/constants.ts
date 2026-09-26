import type { AccessorNames } from '../utils/mockUtils';

// Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
// repository's own, so nothing is fetched and the whole of `src/` comes from `templates/starter-source/solid/`.
export const ALWAYS: readonly string[] = [
  'src/index.tsx',
  'src/App.tsx',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/lib/providers/StoreProvider.tsx',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them, so
// they are written once under `starter-source/shared/` and every target takes that copy.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Solid calls it a primitive and spells it `create*`, and accessors come back rather than values.
export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/primitives',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};
