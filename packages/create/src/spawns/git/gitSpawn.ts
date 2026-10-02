import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

import { resolvedBinary } from '../utils/binaryUtils';
import { repositoryFreeEnv } from '../utils/envUtils';

export interface GitOptions {
  cwd: string;
  // `git diff --no-index -` reads the shipped file from stdin.
  input?: string;
}

interface GitMissing {
  error: Error;
  status: null;
}

export const gitSpawn = (args: string[], options: GitOptions): GitMissing | SpawnSyncReturns<string> => {
  const binary = resolvedBinary('git');

  if (binary === undefined) {
    const missing: GitMissing = {
      error: new Error('git was not found on PATH, and the hooks this tool installs need one.'),
      status: null,
    };

    return missing;
  }

  return spawnSync(binary, args, {
    ...options,
    encoding: 'utf8',
    env: repositoryFreeEnv(),
  });
};
