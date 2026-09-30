import type { PackageManager } from '@config/types';

// Not handed on: a config asking `process.env.VITEST === undefined` took its test branch under the harness.
export const LAUNCHER_KEYS = new Set([
  'npm_execpath',
  'npm_node_execpath',
  'npm_config_user_agent',
  'NODE_ENV',
  'TEST',
]);

export const SPELLINGS: Record<PackageManager, Record<string, string[]>> = {
  'pnpm': {},
  'yarn': {},
  // `yarn check` on 1.x is yarn's own lockfile check.
  'yarn-classic': {
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  'npm': {
    why: ['ls'],
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  'bun': { why: [
    'pm',
    'ls',
    '--all',
  ] },
};
