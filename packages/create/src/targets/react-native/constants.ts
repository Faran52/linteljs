import type { AccessorNames } from '../utils/mockUtils';

// `app.json` carries the project's name three times, so it is emitted.
export const ALWAYS: readonly string[] = [
  'expo-env.d.ts',
  'src/typings/assets.d.ts',
  'src/app/index.tsx',
  'src/app/about.tsx',
  'src/app/version.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/styles/starter.ts',
];

// React Native has no CSS, so the stylesheets are not shared.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};
