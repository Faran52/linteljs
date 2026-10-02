import type { spawnSync } from 'node:child_process';

export const spawnExit = (status: number, stdout = ''): ReturnType<typeof spawnSync> => {
  const result = {
    status,
    stdout,
    stderr: '',
    pid: 0,
    output: [],
    signal: null,
  };

  return result;
};
