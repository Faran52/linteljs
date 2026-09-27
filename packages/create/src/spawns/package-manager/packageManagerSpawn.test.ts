import { spawnSync } from 'node:child_process';

import { spawnExit } from '@mocks/spawnExit';
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

beforeEach(() => {
  spawn.mockReset();
});

describe('packageManagerSpawn', () => {
  it('answers the version the manager printed, trimmed', () => {
    spawn.mockReturnValueOnce(spawnExit(0, '12.5.1\n'));

    expect(packageManagerSpawn('pnpm')).toBe('12.5.1');
    expect(spawn.mock.calls).toEqual([['pnpm', ['--version'], { encoding: 'utf8' }]]);
  });

  it('answers nothing where the manager is not on PATH', () => {
    spawn.mockReturnValueOnce(spawnExit(1));

    expect(packageManagerSpawn('yarn')).toBeUndefined();
  });
});
