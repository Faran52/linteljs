import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/app.html',
  'src/app.d.ts',
  'src/routes/+layout.svelte',
  'src/routes/about/+page.svelte',
  'src/routes/version/+page.svelte',
  'src/components/ui/mark/Mark.svelte',
  'src/components/features/app-header/AppHeader.svelte',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};
