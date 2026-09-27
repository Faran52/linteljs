import { spawnSync } from 'node:child_process';

import { spawnExit } from '@mocks/spawnExit';
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

beforeEach(() => {
  spawn.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('nodeSpawn', () => {
  it('answers the version it printed, with the v stripped', () => {
    spawn.mockReturnValueOnce(spawnExit(0, 'v26.9.0\n'));

    expect(nodeSpawn()).toBe('26.9.0');
    expect(spawn).toHaveBeenCalledWith(expect.stringMatching(/node$/u), ['--version'], { encoding: 'utf8' });
  });

  it('answers nothing, and spawns nothing, where PATH carries no node', () => {
    vi.stubEnv('PATH', '');

    expect(nodeSpawn()).toBeUndefined();
    expect(spawn).not.toHaveBeenCalled();
  });

  it('answers nothing where the one it found would not run', () => {
    spawn.mockReturnValueOnce(spawnExit(1));

    expect(nodeSpawn()).toBeUndefined();
  });
});
