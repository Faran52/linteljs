// `.mjs`: Stryker 10's config lookup carries no `.ts`, so a `stryker.config.ts` is silently not found.

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // pnpm's strict layout keeps the runner out of Stryker's own node_modules, so scanning misses it.
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  // `all`: a rule is built at module load, and per-test attribution reported eleven caught mutants as survivors.
  coverageAnalysis: 'all',

  mutate: [
    'src/rules/**/*.ts',
    'src/utils/**/*.ts',
    'src/plugin.ts',
    '!src/**/*.test.ts',
    '!src/rules/index.ts',
  ],

  // `break` fails the command; `high`/`low` only colour the report.
  thresholds: {
    high: 100,
    low: 95,
    break: 90,
  },

  // A mutant that makes a rule loop forever would otherwise hang the run.
  timeoutMS: 20000,
  concurrency: 4,

  incremental: true,
  incrementalFile: 'node_modules/.cache/stryker-incremental.json',
};

export default config;
