// `.mjs` because Stryker's config lookup has no `.ts`; the runner is named because pnpm's layout hides it.

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],

  // Measured against `all`: identical verdicts, same wall time, and `perTest` names the killing test.
  coverageAnalysis: 'perTest',

  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types.ts',
    '!src/index.ts',
  ],

  // 98.6% on the last full run; `break` sits under it so the weekly audit flags a regression.
  thresholds: {
    high: 100,
    low: 98,
    break: 97,
  },

  // Every case is a real ESLint run, and the typed ones start a TypeScript project service.
  timeoutMS: 30000,
  concurrency: 6,

  incremental: true,
  incrementalFile: 'node_modules/.cache/stryker-incremental.json',
};

export default config;
