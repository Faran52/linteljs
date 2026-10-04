// `.mjs`: Stryker 10's config lookup carries no `.ts`, so a `stryker.config.ts` is silently not found.
import { STRYKER_BASE, strykerPart } from '../../stryker.parts.mjs';

const MUTATED = [
  'src/rules/**/*.ts',
  'src/utils/**/*.ts',
  'src/plugin.ts',
];

const PARTS = {
  'rules-a': ['src/rules/{prefer-arrow-functions,react-no-global-namespace,interface-order}/**/*.ts'],
  'rules-b': ['src/rules/chain-call-newline/**/*.ts', 'src/utils/**/*.ts'],
  'rules-c': [
    'src/rules/{member-newline,comment-delimiter,import-newlines}/**/*.ts',
    'src/rules/{native-valid-accessibility-role,native-valid-accessibility-actions}/**/*.ts',
  ],
  'rest': MUTATED,
};
const {
  globs,
  excluded,
  incrementalFile,
} = strykerPart(PARTS, MUTATED);

const config = {
  ...STRYKER_BASE,
  // `all`: a rule is built at module load, so per-test attribution scores caught mutants as survivors.
  coverageAnalysis: 'all',

  // These suites import `create` by a relative path the sandbox, two folders deeper, cannot resolve.
  ignorePatterns: ['/scripts/**/*.test.ts'],

  mutate: [
    ...globs,
    '!src/**/*.test.ts',
    '!src/rules/index.ts',
    ...excluded,
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

  incrementalFile,
};

export default config;
