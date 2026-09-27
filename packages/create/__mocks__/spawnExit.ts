import type { spawnSync } from 'node:child_process';

// Only `status` and `stdout` are read; the rest of `SpawnSyncReturns` never is.
export const spawnExit = (status: number, stdout = ''): ReturnType<typeof spawnSync> => {
  return {
    status,
    stdout,
    stderr: '',
    pid: 0,
    output: [],
    signal: null,
  };
};
