// Mutation testing, run as `pnpm mutation`, reports in `reports/mutation`. `.mjs` and a named plugin for the reasons
// `packages/eslint-plugin/stryker.config.mjs` records. The runner is patched, under `patchedDependencies`.
import {
  existsSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Level with this package, two below the root: suites read `../../package.json` and `../eslint-config` off their own
// path, which the default sandbox inside this package breaks. The links stand in for `packages/`.
const TEMP_DIR = fileURLToPath(new URL('../../.stryker-tmp', import.meta.url));

mkdirSync(TEMP_DIR, { recursive: true });

for (const sibling of ['eslint-config', 'eslint-plugin']) {
  if (!existsSync(join(TEMP_DIR, sibling))) {
    symlinkSync(`../packages/${sibling}`, join(TEMP_DIR, sibling));
  }
}

// @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  tempDirName: TEMP_DIR,
  // Stryker prefixes an `extends` leaving the package with `../..`, assuming a sandbox two deeper than this one.
  // Naming no file keeps `../../tsconfig.json` as written, which from this sandbox is already right.
  tsconfigFile: 'none',

  // A kill matrix rather than a score: every covering test runs, so a test that only repeats another's kills shows.
  // Module-level code lands as static coverage and runs every related suite, so read those survivors by hand.
  coverageAnalysis: 'perTest',
  disableBail: true,

  // All of `src` is 6986 mutants: under five hours with the static target records skipped (`--ignoreStatic` on
  // `src/targets`), an estimated seven more with them. `--mutate` narrows a run.
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/types.ts',
    '!src/pipeline/e2e/**',
  ],

  // Suites here spawn git and node, which a loaded machine slows past the default margin.
  timeoutMS: 30000,
  // Measured on ten cores: six is as fast as nine, and nine turned kills into timeouts.
  concurrency: 6,

  // A run of hours resumes from what it saved on an interrupt rather than starting over.
  incremental: true,
  incrementalFile: 'node_modules/.cache/stryker-incremental.json',
};

export default config;
