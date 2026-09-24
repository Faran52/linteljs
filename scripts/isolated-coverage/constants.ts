export const REPORT_FILE = 'coverage-final.json';

export const REPORTS_PREFIX = 'linteljs-isolated-';

export const TEST_SUFFIX = '.test.ts';

export const SOURCE_SUFFIX = '.ts';

// Every metric a threshold key can carry, each set to this so no run fails on the merged-suite gate.
export const THRESHOLD_METRICS = ['statements', 'branches', 'functions', 'lines'];

export const THRESHOLD_OFF = 0;

// ponytail: a module every suite imports is covered by all of them, and seventy names say no more than ten.
export const COVERED_BY_SHOWN = 10;
