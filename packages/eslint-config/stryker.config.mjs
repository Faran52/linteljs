/**
 * Mutation testing, run as `pnpm mutation`, reports in `reports/mutation`. `.mjs` because Stryker's config lookup has
 * no `.ts`, and the runner named because pnpm's layout hides it from Stryker's scan. It is patched, under
 * `patchedDependencies`.
 */

// @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],

  // Measured against `all` on vueFramework.ts and importSortUtils.ts: 98 of 111 mutants static, identical verdicts,
  // same wall time. `perTest` keeps the killing test named for the rest.
  coverageAnalysis: 'perTest',

  // The barrel and the types hold no logic worth mutating.
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types.ts',
    '!src/index.ts',
  ],

  // Every case is a real ESLint run, and the typed ones start a TypeScript project service.
  timeoutMS: 30000,
  concurrency: 6,

  incremental: true,
  incrementalFile: 'node_modules/.cache/stryker-incremental.json',
};

export default config;
