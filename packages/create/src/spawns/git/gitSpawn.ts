import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

import { resolvedBinary } from '../utils/binaryUtils';

export interface GitOptions {
  cwd: string;
  // `git diff --no-index -` reads the shipped file from stdin.
  input?: string;
}

// No git answers only what every caller reads first: the error, and no exit status.
interface GitMissing {
  error: Error;
  status: null;
}

export const gitSpawn = (args: string[], options: GitOptions): GitMissing | SpawnSyncReturns<string> => {
  const binary = resolvedBinary('git');

  if (binary === undefined) {
    return {
      error: new Error('git was not found on PATH, and the hooks this tool installs need one.'),
      status: null,
    };
  }

  return spawnSync(binary, args, {
    ...options,
    encoding: 'utf8',
  });
};
