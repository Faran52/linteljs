import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  pnpm: {},
  yarn: {},
  npm: {
    why: ['ls'],
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  bun: { why: [
    'pm',
    'ls',
    '--all',
  ] },
};

export const WORKSPACE_PREFIX = join(tmpdir(), 'linteljs-e2e-');
