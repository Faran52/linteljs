// `.mjs` and a named plugin for the reasons `packages/eslint-plugin/stryker.config.mjs` records.
import {
  existsSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Two below the root: suites read `../../package.json` off their own path, which the default sandbox breaks.
const TEMP_DIR = fileURLToPath(new URL('../../.stryker-tmp', import.meta.url));

mkdirSync(TEMP_DIR, { recursive: true });

for (const sibling of ['eslint-config', 'eslint-plugin']) {
  if (!existsSync(join(TEMP_DIR, sibling))) {
    symlinkSync(`../packages/${sibling}`, join(TEMP_DIR, sibling));
  }
}

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  tempDirName: TEMP_DIR,
  // Stryker prefixes an `extends` with `../..`; naming no file keeps `../../tsconfig.json` as written.
  tsconfigFile: 'none',

  // Locally every covering test runs, so a test that only repeats another's shows; CI bails to stay in hours.
  coverageAnalysis: 'perTest',
  disableBail: !process.env.CI,

  // All of `src` is 6986 mutants, over five hours; `--mutate` narrows a run.
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/types.ts',
    '!src/pipeline/e2e/*.ts',
    '!src/pipeline/e2e/registry/**',
    '!src/pipeline/e2e/runner/**',
    '!src/pipeline/e2e/targets/**',
    '!src/pipeline/e2e/utils/**',
  ],

  // 77.9% on the last full run; `break` sits under it so the weekly audit flags a regression.
  thresholds: {
    high: 95,
    low: 85,
    break: 75,
  },

  // Suites spawn git and node, which a loaded machine slows past the default.
  timeoutMS: 30000,
  // Measured on ten cores: six is as fast as nine, and nine turned kills into timeouts.
  concurrency: 6,

  incremental: true,
  incrementalFile: 'node_modules/.cache/stryker-incremental.json',
};

export default config;
