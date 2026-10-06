// Each carries a `tsconfig.json` that extends the engine's, beside the `.claude-plugin/types/` it writes.
export const MOD_DIRS = [
  'packages/create/templates/project/plugins/linteljs',
  '.claude/skills/linteljs',
];

export const TYPES_FILE = '.claude-plugin/types/claude-code/index.d.ts';

export const WRITTEN_BY = /^\/\/ Written by Claude Code (\d+\.\d+\.\d+)\./u;

// The oldest engine whose types both mods compile against, measured: 2.1.289 passes, and 2.1.277 lacks atom/read.
export const MIN_ENGINE = '2.1.289';
