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
  const childProcess = { spawnSync: vi.fn() };
  return childProcess;
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

    const actual = nodeSpawn();
    expect(actual).toBe('26.9.0');
    const versionArgs = ['--version'];
    const spawnOptions = { encoding: 'utf8' };
    expect(spawn).toHaveBeenCalledWith(expect.stringMatching(/node$/u), versionArgs, spawnOptions);
  });

  it('answers nothing, and spawns nothing, where PATH carries no node', () => {
    vi.stubEnv('PATH', '');

    const actual = nodeSpawn();
    expect(actual).toBeUndefined();
    expect(spawn).not.toHaveBeenCalled();
  });

  it('answers nothing where the one it found would not run', () => {
    spawn.mockReturnValueOnce(spawnExit(1));

    const actual = nodeSpawn();
    expect(actual).toBeUndefined();
  });
});
