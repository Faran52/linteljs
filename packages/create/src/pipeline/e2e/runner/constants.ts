export const STYLEX_CLASSES = /(?<=["'`])x[a-z0-9]{4,9}(?: x[a-z0-9]{4,9})*(?=["'`])/g;

// SvelteKit's per-build random id: one that starts with an x reads as a StyleX class.
export const SVELTEKIT_VERSION_HASH = /version_hash: "[a-z0-9]+"/g;

// Never asserted on: a deprecation deep in another tree is not the project's, and muting it hides a fact.
export const DEPRECATION = /deprecated/i;

// Yarn 1 reports other packages' manifests and undeclared parent peers, which no project owns or can change.
export const YARN_CLASSIC_UPSTREAM = new RegExp([
  'Workspaces can only be enabled in private projects',
  'The engine "[^"]+" appears to be invalid',
  '" has unmet peer dependency "',
  '^warning (?:[^ ]+ > )*[^ ]+@[^ :]+: ',
].join('|'));
