import { spawnSync } from 'node:child_process';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { packageManagerSpawn } from './packageManagerSpawn';

vi.mock('node:child_process', () => {
  return { spawnSync: vi.fn() };
});

const spawn = vi.mocked(spawnSync);

// Only `status` and `stdout` are read; the rest of `SpawnSyncReturns` never is.
const exit = (status: number, stdout = ''): ReturnType<typeof spawnSync> => {
  return {
    status,
    stdout,
    stderr: '',
    pid: 0,
    output: [],
    signal: null,
  };
};

beforeEach(() => {
  spawn.mockReset();
});

describe('packageManagerSpawn', () => {
  it('answers the version the manager printed, trimmed', () => {
    spawn.mockReturnValueOnce(exit(0, '12.5.1\n'));

    expect(packageManagerSpawn('pnpm')).toBe('12.5.1');
    expect(spawn.mock.calls).toEqual([['pnpm', ['--version'], { encoding: 'utf8' }]]);
  });

  // Not on PATH is not a failure here: the refusal, and its wording, belong to `terminal/`.
  it('answers nothing where the manager is not on PATH', () => {
    spawn.mockReturnValueOnce(exit(1));

    expect(packageManagerSpawn('yarn')).toBeUndefined();
  });
});
