import type { E2eVariant } from '../matrix/matrix';

export const STYLEX_CLASSES = /(?<=["'`])x[a-z0-9]{4,9}(?: x[a-z0-9]{4,9})*(?=["'`])/g;

// SvelteKit's per-build random id: one that starts with an x reads as a StyleX class.
export const SVELTEKIT_VERSION_HASH = /version_hash: "[a-z0-9]+"/g;

// Never asserted on: a deprecation deep in another tree is not the project's, and muting it hides a fact.
export const DEPRECATION = /deprecated/i;

// What a variant adds to create's argv; the browser pass adds nothing.
export const CREATE_FLAGS: Record<E2eVariant, readonly string[] | undefined> = {
  'browser': undefined,
  'skip-fix': ['--skip', 'fix'],
  'no-install': ['--no-install'],
};

export const CLEAN_FIXES = ['eslint --fix: nothing to fix', 'stylelint --fix: nothing to fix'];

export const LINT_PROBLEMS = /✖ (\d+) problem/;
