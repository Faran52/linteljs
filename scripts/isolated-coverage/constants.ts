export const REPORT_FILE = 'coverage-final.json';

export const REPORTS_PREFIX = 'linteljs-isolated-';

export const TEST_SUFFIX = '.test.ts';

export const SOURCE_SUFFIX = '.ts';

export const DATA_FILE = 'constants.ts';

// Each named in .claude/rules/repo-structure.md.
export const DOCUMENTED_SUITES = [
  'meta.test.ts',
  'types.test.ts',
  'fixerSafety.test.ts',
  'ruleModules.test.ts',
  'hooks.test.ts',
];

export const THRESHOLD_METRICS = ['statements', 'branches', 'functions', 'lines'];

export const THRESHOLD_OFF = 0;

// ponytail: a module every suite imports is covered by all of them, and seventy names say no more than ten.
export const COVERED_BY_SHOWN = 10;

// A single suite runs in seconds; ten minutes is a hang.
export const TIMEOUT_SECONDS = 600;
