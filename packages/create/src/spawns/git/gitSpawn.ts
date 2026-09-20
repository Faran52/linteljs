import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  delimiter,
  join,
  resolve,
} from 'node:path';
import { env } from 'node:process';

import { isExecutableFile } from '@disk';

export interface GitOptions {
  cwd: string;
  // `git diff --no-index -` reads the shipped file from stdin.
  input?: string;
}

// Resolved from PATH so `sync` can run it from another cwd; executable directories are rejected.
const resolvedGit = (): string | undefined => {
  for (const directory of (env['PATH'] ?? '').split(delimiter)) {
    if (directory === '') {
      continue;
    }

    const candidate = resolve(join(directory, 'git'));

    if (isExecutableFile(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

export const gitSpawn = (args: string[], options: GitOptions): SpawnSyncReturns<string> => {
  const binary = resolvedGit();

  if (binary === undefined) {
    return {
      pid: 0,
      output: [null, '', ''],
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: new Error('git was not found on PATH, and the hooks this tool installs need one.'),
    };
  }

  return spawnSync(binary, args, {
    ...options,
    encoding: 'utf8',
  });
};
