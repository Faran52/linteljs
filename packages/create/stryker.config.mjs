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

// A cold run outlasts a hosted runner's six hours. A file goes to the first part matching it.
const PARTS = {
  'targets-a': 'src/targets/{react,next}/**',
  'targets-b': 'src/targets/{svelte,vue}/**',
  'targets-c': 'src/targets/{solid,webextension}/**',
  'targets-d': 'src/targets/{react-native,astro,angular}/**',
  'targets-e': 'src/targets/**',
  'emitters-a': 'src/emitters/{always,agents}/**',
  'emitters-b': 'src/emitters/**',
  'terminal-answers': 'src/{terminal,answers}/**',
  'rest': 'src/**',
};
const PART_NAMES = Object.keys(PARTS);

const part = process.env.STRYKER_PART;

if (part && !PART_NAMES.includes(part)) {
  throw new Error(`STRYKER_PART "${part}" is not one of ${PART_NAMES.join(', ')}.`);
}

const partGlob = part ? PARTS[part] : 'src/**';
const earlierParts = [];

for (const name of PART_NAMES.slice(0, part ? PART_NAMES.indexOf(part) : 0)) {
  earlierParts.push(`!${PARTS[name]}`);
}

const incrementalSuffix = part ? `-${part}` : '';

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

  // All of `src` is 7168 mutants; `--mutate` narrows a run.
  mutate: [
    `${partGlob}/*.ts`,
    '!src/**/*.test.ts',
    '!src/**/types.ts',
    '!src/pipeline/e2e/*.ts',
    '!src/pipeline/e2e/registry/**',
    '!src/pipeline/e2e/runner/**',
    '!src/pipeline/e2e/targets/**',
    '!src/pipeline/e2e/utils/**',
    ...earlierParts,
  ],

  // Every part scores over 96%; `break` sits under it so the weekly audit flags a regression.
  thresholds: {
    high: 100,
    low: 99,
    break: 95,
  },

  // Suites spawn git and node, which a loaded machine slows past the default.
  timeoutMS: 30000,
  // Measured on ten cores: six is as fast as nine, and nine turned kills into timeouts.
  concurrency: 6,

  incremental: true,
  incrementalFile: `node_modules/.cache/stryker-incremental${incrementalSuffix}.json`,
};

export default config;
