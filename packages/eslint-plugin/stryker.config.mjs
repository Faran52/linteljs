// `.mjs`: Stryker 10's config lookup carries no `.ts`, so a `stryker.config.ts` is silently not found.

const MUTATED = ['src/rules/**/*.ts', 'src/utils/**/*.ts', 'src/plugin.ts'];

// CI splits the run by `STRYKER_PART` into parallel jobs. A file goes to the first part matching it.
const PARTS = {
  'rules-a': ['src/rules/{prefer-arrow-functions,react-no-global-namespace,interface-order}/**/*.ts'],
  'rules-b': ['src/rules/chain-call-newline/**/*.ts', 'src/utils/**/*.ts'],
  'rules-c': [
    'src/rules/{member-newline,comment-delimiter,import-newlines}/**/*.ts',
    'src/rules/{native-valid-accessibility-role,native-valid-accessibility-actions}/**/*.ts',
  ],
  'rest': MUTATED,
};
const PART_NAMES = Object.keys(PARTS);

const part = process.env.STRYKER_PART;

if (part && !PART_NAMES.includes(part)) {
  throw new Error(`STRYKER_PART "${part}" is not one of ${PART_NAMES.join(', ')}.`);
}

const partGlobs = part ? PARTS[part] : MUTATED;
const earlierParts = [];

for (const name of PART_NAMES.slice(0, part ? PART_NAMES.indexOf(part) : 0)) {
  for (const glob of PARTS[name]) {
    earlierParts.push(`!${glob}`);
  }
}

const incrementalSuffix = part ? `-${part}` : '';

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // pnpm's strict layout keeps the runner out of Stryker's own node_modules, so scanning misses it.
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  // `all`: a rule is built at module load, and per-test attribution reported eleven caught mutants as survivors.
  coverageAnalysis: 'all',

  mutate: [
    ...partGlobs,
    '!src/**/*.test.ts',
    '!src/rules/index.ts',
    ...earlierParts,
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
  incrementalFile: `node_modules/.cache/stryker-incremental${incrementalSuffix}.json`,
};

export default config;
