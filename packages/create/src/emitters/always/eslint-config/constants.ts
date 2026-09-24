import type { Answers } from '#answers';
import type { LibraryLayer } from '#config/types';

/**
 * The libraries and routers with a layer behind them, in emit order so the written config is stable; the rest bring
 * no ESLint rules. Kept `as const` rather than annotated `readonly LibraryLayer[]`: the annotation widened the members
 * away, and `src/types.test.ts` holds this union against `LibraryLayer`, so a layer dropped here fails there.
 */
export const LIBRARY_LAYERS = [
  'tanstack-query',
  'tanstack-router',
  'tailwind',
] as const satisfies readonly LibraryLayer[];

// Which answer turns each layer on. None of the three is a `library` any more: the router, the styling system and
// the data layer each became a field of its own, so the gate is the answer that installs the package behind it.
export const LAYER_ANSWERS: Record<LibraryLayer, (answers: Answers) => boolean> = {
  'tanstack-query': (answers) => {
    return answers.data === 'tanstack-query';
  },
  'tanstack-router': (answers) => {
    return answers.router === 'tanstack-router';
  },
  'tailwind': (answers) => {
    return answers.styling === 'tailwind';
  },
};

// The subpath, not the barrel, which loads all six framework layers.
export const PACKAGE = '@linteljs/eslint-config/compose-config';

// `plugins/linteljs/` is shipped, not written here; `.agents/` is the codex half of `.claude/`. Ignoring one and
// not the other made a real project's gate fail on skill files mirrored into `.agents/`.
export const BASE_IGNORES = [
  'dist/**',
  'coverage/**',
  '.claude/**',
  '.agents/**',
  'plugins/linteljs/**',
];

// Matches the emitted @stylistic/max-len; looser, React Native's ignores self-reported a finding.
export const MAX_LINE = 120;
