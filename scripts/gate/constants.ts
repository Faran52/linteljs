// Independent once `build` has run, so they run at once.
export const STEPS = [
  'lint',
  'lint:types',
  'lint:starters',
  'lint:css',
  'typecheck',
  'test:coverage',
];

// Set for the steps, so `pnpm pack` skips the `prepack` build the gate has already run.
export const BUILT_ENV = 'LINTELJS_GATE_BUILT';

export const LOG_DIR = 'node_modules/.cache/linteljs-gate';

// Lines of a failed step's log shown from each end.
export const HEAD_LINES = 8;

export const TAIL_LINES = 6;

export const MS_PER_SECOND = 1000;
