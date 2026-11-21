// `.mjs` for the reason `packages/eslint-plugin/stryker.config.mjs` records.
import {
  existsSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STRYKER_BASE, strykerPart } from '../../stryker.parts.mjs';

// Two below the root, with `create` linked beside the sandbox: the suites read its templates at `../create`.
const TEMP_DIR = fileURLToPath(new URL('../../.stryker-tmp', import.meta.url));

mkdirSync(TEMP_DIR, { recursive: true });

const SIBLINGS = ['create'];

for (const sibling of SIBLINGS) {
  const isLinked = existsSync(join(TEMP_DIR, sibling));

  if (!isLinked) {
    symlinkSync(`../packages/${sibling}`, join(TEMP_DIR, sibling));
  }
}

// Split by lines of source, about 1,500 each, until a cold run measures them.
const PARTS = {
  'utils-a': ['src/utils/{effectUtils,elementUtils}.ts'],
  'utils-b': ['src/utils/{statementUtils,sourceUtils}.ts'],
  'utils-c': ['src/utils/{callUtils,simplifyUtils,bindingUtils}.ts'],
  'rest': ['src/**/*.ts'],
};
const {
  globs,
  excluded,
  incrementalFile,
} = strykerPart(PARTS, ['src/**/*.ts']);

const config = {
  ...STRYKER_BASE,
  tempDirName: TEMP_DIR,
  // Stryker prefixes an `extends` with `../..`; naming no file keeps `../../tsconfig.json` as written.
  tsconfigFile: 'none',
  // The runner defaults to threads; this suite runs on vitest's forks.
  vitest: { pool: 'forks' },

  coverageAnalysis: 'perTest',
  disableBail: !process.env.CI,

  mutate: [
    ...globs,
    '!src/**/*.test.ts',
    ...excluded,
  ],

  // `break` stops a collapsed run; the audit's summary step fails on any one mutant not killed.
  thresholds: {
    high: 100,
    low: 99,
    break: 99,
  },

  // A static mutant in `constants.ts` reruns every suite, the shipped compositions among them.
  timeoutMS: 120000,
  concurrency: 6,

  incrementalFile,
};

export default config;
