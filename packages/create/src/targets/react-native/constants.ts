import type { Answers } from '#answers/registry';
import type { AccessorNames } from '../utils/mockUtils';

/**
 * Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
 * repository's own, so nothing is fetched, nothing is renamed and nothing is patched. `app.json` is not here
 * because three of its fields are the project's name and it is emitted.
 *
 * The routes are the directory, as they are in any expo-router application, so there is no router answer and no
 * page switch: the tab bar is what the other targets draw as a header.
 */
export const ALWAYS: readonly string[] = [
  'expo-env.d.ts',
  'src/typings/assets.d.ts',
  'src/app/index.tsx',
  'src/app/about.tsx',
  'src/app/version.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/styles/starter.ts',
];

// The page tables have no framework in them, so they are the same bytes here as everywhere else. The stylesheets
// are not: React Native has no CSS and no cascade, so `styles/starter.ts` above is this target's own.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
];

// Metro has no Tailwind pipeline of its own, so all three ship only with the answer that brings NativeWind.
export const isTailwind = (answers: Answers): boolean => {
  return answers.styling === 'tailwind';
};

// React Native takes React's hooks, at the `src/hooks/` its own record already names.
export const ACCESSORS: AccessorNames = {
  directory: 'src/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  extension: 'ts',
  testSuffix: '.test.ts',
};
