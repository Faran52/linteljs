/**
 * Mutation testing. Line coverage says a line ran, not that a test would notice if it were wrong, and this repo
 * has been caught by the difference: both option reads in one rule could be deleted with the suite green and
 * coverage still reporting 100%, because v8 does not distinguish the taken side of `??`. Stryker changes the code
 * and expects the suite to go red, so a surviving mutant is a line no test pins. `pnpm mutation` runs it; reports
 * land in `reports/mutation`.
 *
 * `.mjs`, although this package is `type: module` and `.js` would already be ESM: Stryker's config discovery looks for
 * `stryker.conf.json`, `stryker.config.json` and `stryker.config.mjs`, and nothing else. Renamed to `.js` it is simply
 * not found, and the run falls back to defaults with no error. The extension is upstream's list, not a redundancy.
 */

// @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // Named explicitly: pnpm's strict layout keeps the runner out of Stryker's own node_modules, so scanning misses it.
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  /**
   * `all`, not `perTest`. A rule is built at module load, so a mutant breaking the definition throws before any
   * test body runs and per-test attribution records it as covered by nothing: that reported eleven module-level
   * mutants as survivors when the suite does catch them. `all` narrows the problem rather than removing it, and
   * `plugin.ts` is where the remainder shows: a mutant that throws while *it* is evaluated takes `meta.test.ts`
   * down as a failed suite with no test results at all, and a run with no results reads here as Survived. Verified
   * by hand, one mutant at a time: emptying the `presets` array literal fails that file loudly and is still
   * reported as a survivor. So a survivor here is a question, not a verdict: reproduce it in the source and look
   * at what the suite does before believing it.
   */
  coverageAnalysis: 'all',

  /**
   * The rules, the helpers they share, and the preset assembly. The registry and the type declarations hold no
   * logic worth mutating; `plugin.ts` does, and was left out on the strength of a comment naming only the other
   * two. Adding it paid immediately: five survivors were real gaps and `meta.test.ts` now pins each. Both flat
   * block names could be emptied, both arms of the `overrides` branch inverted, and `configs` dropped from the
   * default export, all with the suite green and only `smoke.js` between that last one and a release. Read the
   * rest of its survivors with the caveat below in hand: everything in this file runs at module load, so it is
   * the worst case for the attribution problem, not a file with poor tests.
   */
  mutate: [
    'src/rules/**/*.ts',
    'src/utils/**/*.ts',
    'src/plugin.ts',
    '!src/**/*.test.ts',
    '!src/rules/index.ts',
  ],

  /**
   * A survivor is a defect until proven otherwise, so the gate is strict: `break` fails the command, `high`/`low`
   * only colour the report. The survivors that remain are dominated by one shape, a guard skipping a rewrite that
   * would have written the same text anyway: the fixers emit the canonical gap, so when the gap is already
   * canonical, removing the guard changes nothing observable. Feeding those rules whitespace that is *not*
   * canonical tells the two apart, and the fixtures doing it are in `union-newline` and `export-specifier-newline`.
   * Anything still surviving has been replayed through `scripts/auditSurvivors.js`, which applies the mutant and
   * compares reports and fixed output against the original across the shared corpus. That is evidence of
   * equivalence, not proof: a shape the corpus lacks could still separate them, so growing it strengthens the claim.
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
