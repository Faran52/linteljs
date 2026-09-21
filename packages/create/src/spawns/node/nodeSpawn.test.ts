import { spawnSync } from 'node:child_process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { nodeSpawn } from './nodeSpawn';

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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('nodeSpawn', () => {
  it('answers the version it printed, with the v stripped', () => {
    spawn.mockReturnValueOnce(exit(0, 'v26.9.0\n'));

    expect(nodeSpawn()).toBe('26.9.0');
  });

  // The case this exists for: bun running the CLI on a machine with no Node at all.
  it('answers nothing, and spawns nothing, where PATH carries no node', () => {
    vi.stubEnv('PATH', '');

    expect(nodeSpawn()).toBeUndefined();
    expect(spawn).not.toHaveBeenCalled();
  });

  it('answers nothing where the one it found would not run', () => {
    spawn.mockReturnValueOnce(exit(1));

    expect(nodeSpawn()).toBeUndefined();
  });
});
