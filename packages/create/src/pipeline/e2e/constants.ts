import type { PackageManager } from '@answers';

// Every manager, and every scaffolder and install the CLI spawns, reads the workspace registry from its environment.
export const LAUNCHER_KEYS = new Set(['npm_execpath', 'npm_node_execpath', 'npm_config_user_agent']);

// `why` and a script name, spelled the way each manager wants them.
export const SPELLINGS: Record<PackageManager, Record<string, string[]>> = {
  pnpm: {},
  yarn: {},
  npm: {
    why: ['ls'],
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  bun: { why: ['pm', 'ls', '--all'] },
};
