// Independent once `build` has run, so they run at once.
export const STEPS = [
  'lint',
  'lint:types',
  'lint:css',
  'typecheck',
  'test:coverage',
  'typegen',
  'tailwind-styles',
  'css-markup',
  'test:band',
];

// A step whose cache key carries the version of the binary it runs.
export const ENGINES = new Map([['test:band', 'node_modules/.bin/claude']]);

// Set for the steps, so `pnpm pack` skips the `prepack` build the gate has already run.
export const BUILT_ENV = 'LINTELJS_GATE_BUILT';

export const LOG_DIR = 'node_modules/.cache/linteljs-gate';

// Lines of a failed step's log shown from each end.
export const HEAD_LINES = 8;

export const TAIL_LINES = 6;

export const MS_PER_SECOND = 1000;

// Set to rerun every step, even one whose inputs match its last pass.
export const NO_CACHE_ENV = 'LINTELJS_GATE_NO_CACHE';

export const SKIPPED_SECONDS = '0.0';

// Neither ESLint nor tsc reads Markdown; the suites do.
export const UNREAD = new Map([
  ['lint', ['.md']],
  ['typecheck', ['.md']],
]);

// Gitignored, yet read: the mod types `pnpm typecheck` and `pnpm lint` take, and what pnpm installed.
export const IGNORED_INPUTS = [
  '.claude/skills/linteljs/.claude-plugin/types',
  'packages/create/templates/project/plugins/linteljs/.claude-plugin/types',
  'node_modules/.pnpm/lock.yaml',
];
