/**
 * Mutation testing: coverage says a line ran, not that a test would notice it wrong, and v8 does not distinguish the
 * taken side of `??`. `pnpm mutation` runs it; reports land in `reports/mutation`.
 *
 * `.mjs`, not TypeScript: `SUPPORTED_CONFIG_FILE_NAMES` in `@stryker-mutator/core` 10 carries `json`, `js`, `mjs` and
 * `cjs` only, so a `stryker.config.ts` is silently not found and the run falls back to defaults.
 */

// @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // Named explicitly: pnpm's strict layout keeps the runner out of Stryker's own node_modules, so scanning misses it.
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  /**
   * `all`, not `perTest`: a rule is built at module load, so a mutant breaking it throws before any test body runs,
   * and per-test attribution reported eleven caught mutants as survivors. A mutant that throws while `plugin.ts` is
   * evaluated still fails `meta.test.ts` with no results, which reads as Survived, so reproduce a survivor before
   * believing it.
   */
  coverageAnalysis: 'all',

  // The registry and the type declarations hold no logic worth mutating. `plugin.ts` runs entirely at module load,
  // the worst case for the attribution problem above.
  mutate: [
    'src/rules/**/*.ts',
    'src/utils/**/*.ts',
    'src/plugin.ts',
    '!src/**/*.test.ts',
    '!src/rules/index.ts',
  ],

  /**
   * A survivor is a defect until proven otherwise: `break` fails the command, `high`/`low` only colour the report.
   * Most survivors are a guard skipping a rewrite that would write the same canonical gap anyway; non-canonical
   * whitespace fixtures in `union-newline` and `export-specifier-newline` tell those apart, and the dead-code ledger
   * argues the rest row by row.
   */
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
