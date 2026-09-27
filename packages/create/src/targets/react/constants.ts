import type { Router } from '@config/types';
import type { AccessorNames } from '../utils/mockUtils';

export const ROUTERS: readonly Router[] = ['react-router', 'react-router-framework', 'tanstack-router'];

// Framework mode routes through React Router's own build, so it has no `App.tsx`.
export const DECLARATIVE_ROUTERS: readonly Router[] = ['react-router', 'tanstack-router'];

export const ALWAYS: readonly string[] = [
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// A camelCase `.tsx` is refused by the naming rule, so hooks take `.ts` suites.
export const REACT_ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};
