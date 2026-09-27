import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/index.tsx',
  'src/App.tsx',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/lib/providers/StoreProvider.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/primitives',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};
