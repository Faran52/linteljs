/**
 * Every file the template writes whatever was answered, from this target's own tree. No `scaffold` on this record:
 * the tree is this repository's own, so nothing is fetched.
 *
 * The App Router is unconditional here, as it is in any Next application: the routes are the directory, and this
 * target asks no router question to answer otherwise.
 */
export const ALWAYS: readonly string[] = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/about/page.tsx',
  'src/app/version/page.tsx',
  'src/components/features/app-header/AppHeader.tsx',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

/**
 * React's, to the byte. Next renders React, so a primitive, a store and an api module are the same file here as
 * there; what differs is the document, the routing and which components are the client boundary, and those are
 * this target's own above. Taking the copy rather than keeping one is the whole of why `shared` names a tree.
 */
export const FROM_REACT: readonly string[] = [
  'src/components/ui/mark/Mark.tsx',
  'src/lib/apis/contact/index.ts',
  'src/components/ui/text-input/TextInput.tsx',
];

// Next takes React's hooks to the byte, the way it takes React's primitives.
export { REACT_ACCESSORS as ACCESSORS } from '../react/constants';
