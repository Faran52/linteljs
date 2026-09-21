import type { PackageManager } from '@answers';

// Every manager, and every scaffolder and install the CLI spawns, reads the workspace registry from its environment.
export const LAUNCHER_KEYS = new Set(['npm_execpath', 'npm_node_execpath', 'npm_config_user_agent']);

// `why` and a script name, spelled the way each manager wants them.
export const SPELLINGS: Record<PackageManager, Record<string, string[]>> = {
  'pnpm': {},
  'yarn': {},
  // `yarn check` on 1.x is yarn's own lockfile check, so the project's gate is only reachable through `run`.
  'yarn-classic': {
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  'npm': {
    why: ['ls'],
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  'bun': { why: ['pm', 'ls', '--all'] },
};

// The one failure worth retrying: a scaffolder pins the version it just saw, and `create astro` once asked for a
// version 33 seconds before it was published. Matched on the error code, since any other failure is real.
export const UNPUBLISHED_YET_BY_PM: Record<PackageManager, string[]> = {
  'pnpm': ['ERR_PNPM_NO_MATCHING_VERSION'],
  'npm': ['npm ERR! code E404', 'npm ERR! 404 Not Found'],
  'yarn': ['YN0027'],
  // Measured on 1.22.22: no code, just the sentence.
  'yarn-classic': ["Couldn't find any versions"],
  'bun': ['error:'],
};
