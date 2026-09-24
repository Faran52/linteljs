import { MANAGER_FLOORS } from '@config/constants';

import type { PackageManager } from '@answers';

/**
 * Every manager, and every install the CLI spawns, reads the workspace registry from its environment. What
 * launched the suite is not handed on: the manager's own keys, and the `TEST` and `NODE_ENV` vitest sets (with
 * every `VITEST*` key, filtered by prefix). A config that asks `process.env.VITEST === undefined` took its test
 * branch under the harness, so `react-router build` found no React Router plugin: no user's shell carries them.
 */
export const LAUNCHER_KEYS = new Set([
  'npm_execpath',
  'npm_node_execpath',
  'npm_config_user_agent',
  'NODE_ENV',
  'TEST',
]);

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

/**
 * The release each yarn case runs. Both answer to `yarn`, so one on PATH can only ever be one of the two, and a
 * machine carrying yarn 1 recorded every `yarn` case as `yarn-classic`. Asked for through corepack by release;
 * inside the project the `packageManager` field the CLI writes then selects the same release. The floor for yarn 1,
 * which is its last release, and for yarn 4 the one `e2e.yml` used to install globally.
 */
export const COREPACK_RELEASES: Record<PackageManager, string | undefined> = {
  'pnpm': undefined,
  'npm': undefined,
  'yarn': '4.18.0',
  'yarn-classic': MANAGER_FLOORS['yarn-classic'],
  'bun': undefined,
};
