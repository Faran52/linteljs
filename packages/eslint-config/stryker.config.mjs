// `.mjs` because Stryker's config lookup has no `.ts`.
import { STRYKER_BASE, strykerPart } from '../../stryker.parts.mjs';

// A static mutant reruns every suite, so parts are sized by static mutants (of 1016 in all).
const PARTS = {
  layers: ['src/layers/**/*.ts'],
  frameworks: ['src/frameworks/**/*.ts'],
  rest: ['src/**/*.ts'],
};
const {
  globs,
  excluded,
  incrementalFile,
} = strykerPart(PARTS, ['src/**/*.ts']);

const config = {
  ...STRYKER_BASE,

  // Measured against `all`: identical verdicts, same wall time, and `perTest` names the killing test.
  coverageAnalysis: 'perTest',

  mutate: [
    ...globs,
    '!src/**/*.test.ts',
    '!src/types.ts',
    '!src/index.ts',
    ...excluded,
  ],

  // `break` sits under 100 so the weekly audit flags a regression.
  thresholds: {
    high: 100,
    low: 99,
    break: 99,
  },

  // Every case is a real ESLint run, and the typed ones start a TypeScript project service. A mutant every suite
  // covers runs them all: at 30s one in `presetUtils.ts` timed out that its own suite kills in 3ms.
  timeoutMS: 120000,
  concurrency: 6,

  incrementalFile,
};

export default config;
