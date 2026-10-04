// `.mjs` for the reason `packages/eslint-plugin/stryker.config.mjs` records.
import {
  existsSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STRYKER_BASE, strykerPart } from '../../stryker.parts.mjs';

// Two below the root: suites read `../../package.json` off their own path, which the default sandbox breaks.
const TEMP_DIR = fileURLToPath(new URL('../../.stryker-tmp', import.meta.url));

mkdirSync(TEMP_DIR, { recursive: true });

const SIBLINGS = ['eslint-config', 'eslint-plugin'];

for (const sibling of SIBLINGS) {
  const isLinked = existsSync(join(TEMP_DIR, sibling));

  if (!isLinked) {
    symlinkSync(`../packages/${sibling}`, join(TEMP_DIR, sibling));
  }
}

// A cold run outlasts a hosted runner's six hours.
const PARTS = {
  'targets-a': ['src/targets/{react,next}/**/*.ts'],
  'targets-b': ['src/targets/{svelte,vue}/**/*.ts'],
  'targets-c': ['src/targets/{solid,webextension}/**/*.ts'],
  'targets-d': ['src/targets/{react-native,astro,angular}/**/*.ts'],
  'targets-e': ['src/targets/**/*.ts'],
  'emitters-a': ['src/emitters/{always,agents}/**/*.ts'],
  'emitters-b': ['src/emitters/**/*.ts'],
  'terminal-answers': ['src/{terminal,answers}/**/*.ts'],
  'config-utils-rings': ['src/{config/**/*,utils/**/*,rings}.ts'],
  'rest': ['src/**/*.ts'],
  'templates': ['templates/project/**/utils/*.ts'],
};
const {
  globs,
  excluded,
  incrementalFile,
} = strykerPart(PARTS, ['src/**/*.ts', 'templates/project/**/utils/*.ts']);

const config = {
  ...STRYKER_BASE,
  tempDirName: TEMP_DIR,
  // Stryker prefixes an `extends` with `../..`; naming no file keeps `../../tsconfig.json` as written.
  tsconfigFile: 'none',

  // Locally every covering test runs, so a test that only repeats another's shows; CI bails to stay in hours.
  coverageAnalysis: 'perTest',
  disableBail: !process.env.CI,

  // `src` is 7833 mutants and the template utils 2205; `--mutate` narrows a run.
  mutate: [
    ...globs,
    '!src/**/*.test.ts',
    '!src/**/types.ts',
    '!templates/**/*.test.ts',
    ...excluded,
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

  incrementalFile,
};

export default config;
