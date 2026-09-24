import type { Router } from '@answers/target/router/routerAnswer';
import type { AccessorNames } from '../utils/mockUtils';

// The only target with a `routers` slot, so it supports every router the vocabulary has.
export const ROUTERS: readonly Router[] = ['react-router', 'react-router-framework', 'tanstack-router'];

/*
 * The two that route inside an `App` this repository writes. Framework mode is the third value of the same answer
 * and routes through React Router's own build instead, so it has no `App.tsx` and takes its header from the
 * `react-router` variant: the same `NavLink` off the same list.
 */
export const DECLARATIVE_ROUTERS: readonly Router[] = ['react-router', 'tanstack-router'];

// Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
// repository's own, so nothing is fetched and the whole of `src/` comes from `templates/starter-source/react/`.
export const ALWAYS: readonly string[] = [
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
];

// Both slots the entry wraps the application in, which the suites that render a page wrap it in too.
export const PROVIDERS: string[] = [
  'src/lib/providers/StoreProvider.tsx',
  'src/lib/providers/DataProvider.tsx',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them, so
// they are written once under `starter-source/shared/` and every target takes that copy.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

/*
 * `src/lib/hooks/` and `use*`, with a `.ts` suite: a hook is not a component, and a camelCase `.tsx` is refused by
 * the naming rule that keeps components PascalCase. Next takes the same three; React Native puts its hooks at
 * `src/hooks/` and says so in its own record.
 */
export const REACT_ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  extension: 'ts',
  testSuffix: '.test.ts',
};
