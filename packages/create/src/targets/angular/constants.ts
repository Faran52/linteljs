import type { AccessorNames } from '../utils/mockUtils';

/**
 * Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
 * repository's own, so nothing is fetched. `angular.json` is not here because it carries the project's name and is
 * emitted, and `tsconfig.spec.json` is not here because this CLI emits one tsconfig and the build reads it.
 */
export const ALWAYS: readonly string[] = [
  'tsconfig.app.json',
  'src/index.html',
  'src/main.ts',
  'src/app/app.ts',
  'src/app/app.html',
  'src/app/app.css',
  'src/app/app.config.ts',
  'src/app/app.routes.ts',
  'src/app/home/home.ts',
  'src/app/home/home.html',
  'src/app/about/about.ts',
  'src/app/about/about.html',
  'src/app/version/version.ts',
  'src/app/version/version.html',
  'src/components/ui/mark/mark.ts',
  'src/components/ui/mark/mark.html',
  'src/components/features/app-header/app-header.ts',
  'src/components/features/app-header/app-header.html',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Angular has no hooks and no composables. This runs in an injection context, and is kebab like every file
// this target writes.
export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/services',
  query: 'extended-query',
  mutation: 'extended-mutation',
  testSuffix: '.spec.ts',
};
