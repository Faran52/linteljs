import type { Answers } from '@answers/registry';
import type { AccessorNames } from '../utils/mockUtils';

/**
 * Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
 * repository's own, so nothing is fetched and the whole of `src/` comes from `templates/starter-source/svelte/`.
 *
 * The router is unconditional here, as it is in any SvelteKit application: the routes are the directory, and this
 * target asks no router question to answer otherwise.
 */
export const ALWAYS: readonly string[] = [
  'src/app.html',
  'src/app.d.ts',
  'src/routes/+layout.svelte',
  'src/routes/about/+page.svelte',
  'src/routes/version/+page.svelte',
  'src/components/ui/mark/Mark.svelte',
  'src/components/features/app-header/AppHeader.svelte',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them, so
// they are written once under `starter-source/shared/` and every target takes that copy.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// A file varies by one answer and no more, which is what keeps this a sum rather than a product.
export const hasStore = (answers: Answers): boolean => {
  return answers.store !== undefined;
};

export const hasForm = (answers: Answers): boolean => {
  return answers.form !== undefined;
};

// The button is what either of them gives the page to press.
export const pressable = (answers: Answers): boolean => {
  return hasStore(answers) || hasForm(answers);
};

// `create*` is the verb Svelte's own query binding uses, and the reactive object comes back untouched.
export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  extension: 'ts',
  testSuffix: '.test.ts',
};
