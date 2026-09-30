import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/index.tsx',
  'src/App.tsx',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/error-boundary/ErrorBoundary.tsx',
  'src/lib/providers/store/StoreProvider.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/statuses.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/primitives',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};
