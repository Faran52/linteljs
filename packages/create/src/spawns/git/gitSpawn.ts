import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

import { resolvedBinary } from '../utils/binaryUtils';

export interface GitOptions {
  cwd: string;
  // `git diff --no-index -` reads the shipped file from stdin.
  input?: string;
}

export const gitSpawn = (args: string[], options: GitOptions): SpawnSyncReturns<string> => {
  const binary = resolvedBinary('git');

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
