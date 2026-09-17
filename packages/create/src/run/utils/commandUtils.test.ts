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

  it('does nothing when the manager on PATH is new enough', () => {
    spawn.mockReturnValueOnce(exit(0, '12.4.1\n'));

    ensurePackageManager('pnpm', notice);

    expect(calls()).toEqual(['pnpm --version']);
  });

  /**
   * Yarn 1 is still on a great many machines and `yarn create` means something else there, so the old check, which
   * asked only whether yarn existed, let the scaffold run under it and fail with `exited with 127` three stages on.
   * Refused rather than upgraded: someone running an older major on purpose keeps it, and hears why this stopped.
   */
  it('refuses a manager whose major is below what a generated project declares', () => {
    spawn.mockReturnValueOnce(exit(0, '1.22.22\n'));

    expect(() => {
      ensurePackageManager('yarn', notice);
    }).toThrow('yarn 1.22.22 is on PATH, and a project this CLI writes declares yarn 4.18.0');
    expect(calls()).toEqual(['yarn --version']);
  });

  it('names the corepack command that would install the right one', () => {
    spawn.mockReturnValueOnce(exit(0, '8.15.9\n'));

    expect(() => {
      ensurePackageManager('pnpm', notice);
    }).toThrow('corepack install -g pnpm@12.4.1');
  });

  // No corepack shim for bun, so the refusal points at the installer instead.
  it('points an older bun at its own installer', () => {
    spawn.mockReturnValueOnce(exit(0, '0.8.1\n'));

    expect(() => {
      ensurePackageManager('bun', notice);
    }).toThrow('https://bun.sh');
  });

  it('accepts a newer major than the one declared', () => {
    spawn.mockReturnValueOnce(exit(0, '13.0.0\n'));

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
