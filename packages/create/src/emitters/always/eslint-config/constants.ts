import type { LibraryLayer } from '@config/types';

// `as const`: annotating it `readonly LibraryLayer[]` would widen the members away.
export const LIBRARY_LAYERS = [
  'tanstack-query',
  'tanstack-router',
  'tailwind',
  'stylex',
] as const satisfies readonly LibraryLayer[];

// The subpath, not the barrel, which loads all six framework layers.
export const PACKAGE = '@linteljs/eslint-config/compose-config';

// `.agents/` is the codex half of `.claude/`; ignoring only one failed a real project's gate.
export const BASE_IGNORES = [
  'dist/**',
  'coverage/**',
  '.claude/**',
  '.agents/**',
  'plugins/linteljs/**',
];
