// `.mjs` because Stryker's config lookup has no `.ts`; the runner is named because pnpm's layout hides it.

// A static mutant reruns every suite, so parts are sized by static mutants (of 1016 in all). A file goes to the
// first part matching it.
const PARTS = {
  layers: 'src/layers/**/*.ts',
  frameworks: 'src/frameworks/**/*.ts',
  rest: 'src/**/*.ts',
};
const PART_NAMES = Object.keys(PARTS);

const part = process.env.STRYKER_PART;

if (part && !PART_NAMES.includes(part)) {
  throw new Error(`STRYKER_PART "${part}" is not one of ${PART_NAMES.join(', ')}.`);
}

const partGlob = part ? PARTS[part] : 'src/**/*.ts';
const earlierParts = [];

for (const name of PART_NAMES.slice(0, part ? PART_NAMES.indexOf(part) : 0)) {
  earlierParts.push(`!${PARTS[name]}`);
}

const incrementalSuffix = part ? `-${part}` : '';

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: [
    'html',
    'json',
    'clear-text',
    'progress',
  ],

  // Measured against `all`: identical verdicts, same wall time, and `perTest` names the killing test.
  coverageAnalysis: 'perTest',

  mutate: [
    partGlob,
    '!src/**/*.test.ts',
    '!src/types.ts',
    '!src/index.ts',
    ...earlierParts,
  ],

  // `break` sits under 100 so the weekly audit flags a regression.
  thresholds: {
    high: 100,
    low: 99,
    break: 99,
  },

  // Every case is a real ESLint run, and the typed ones start a TypeScript project service.
  timeoutMS: 30000,
  concurrency: 6,

  incremental: true,
  incrementalFile: `node_modules/.cache/stryker-incremental${incrementalSuffix}.json`,
};

export default config;
