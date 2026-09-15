import { spawnSync } from 'node:child_process';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ensurePackageManager, isCommandAvailable } from './commandUtils';

vi.mock('node:child_process', () => {
  return { spawnSync: vi.fn() };
});

const spawn = vi.mocked(spawnSync);

// Only `status` is read; the rest of `SpawnSyncReturns` never is.
const exit = (status: number): ReturnType<typeof spawnSync> => {
  return {
    status,
    stdout: '',
    stderr: '',
    pid: 0,
    output: [],
    signal: null,
  };
};

beforeEach(() => {
  spawn.mockReset();
});

const calls = (): string[] => {
  return spawn.mock.calls.map(([command, args]) => {
    return [command, ...args ?? []].join(' ');
  });
};

describe('isCommandAvailable', () => {
  it('answers by the exit status of --version', () => {
    spawn.mockReturnValueOnce(exit(0)).mockReturnValueOnce(exit(1));

    expect(isCommandAvailable('pnpm')).toBe(true);
    expect(isCommandAvailable('nope')).toBe(false);
    expect(calls()).toEqual(['pnpm --version', 'nope --version']);
  });
});

describe('ensurePackageManager', () => {
  const notices: string[] = [];
  const notice = (message: string): void => {
    notices.push(message);
  };

  it('does nothing when the manager is on PATH', () => {
    spawn.mockReturnValueOnce(exit(0));

    ensurePackageManager('pnpm', notice);

    expect(calls()).toEqual(['pnpm --version']);
  });

  it('installs corepack and then the manager when both are missing', () => {
    spawn
      .mockReturnValueOnce(exit(1))
      .mockReturnValueOnce(exit(1))
      .mockReturnValue(exit(0));

    ensurePackageManager('yarn', notice);

    expect(calls()).toEqual([
      'yarn --version',
      'corepack --version',
      'npm install -g corepack',
      'corepack enable',
      'corepack install -g yarn',
    ]);
    expect(notices).toContain('Installing yarn via corepack...');
  });

  it('surfaces the failing command', () => {
    spawn
      .mockReturnValueOnce(exit(1))
      .mockReturnValueOnce(exit(0))
      .mockReturnValueOnce(exit(0))
      .mockReturnValueOnce({
        ...exit(1),
        stderr: 'denied',
      });

    expect(() => {
      ensurePackageManager('pnpm', notice);
    }).toThrow('corepack install -g pnpm failed: denied');
  });

  // corepack knows npm, pnpm and yarn only; `corepack install -g bun` is not a thing.
  it('refuses bun with an install hint rather than a corepack error', () => {
    spawn.mockReturnValueOnce(exit(1));

    expect(() => {
      ensurePackageManager('bun', notice);
    }).toThrow('https://bun.sh');
    expect(calls()).toEqual(['bun --version']);
  });
});
