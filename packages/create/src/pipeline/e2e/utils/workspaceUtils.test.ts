import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';

import {
  answerFlags,
  managersToRun,
  versionFrom,
} from './workspaceUtils';

import type { PackageManager } from '@config/types';

const ANSWERED: Record<string, string> = {
  pnpm: '12.6.0',
  npm: '11.0.0\nnpm notice New minor version of npm available!',
  yarn: '1.22.22',
  bun: 'spawn bun ENOENT',
};

vi.mock('./processUtils', () => {
  return {
    runPm: vi.fn(async (pm: PackageManager) => {
      return Promise.resolve({
        status: 0,
        output: ANSWERED[pm],
      });
    }),
  };
});

describe('answerFlags', () => {
  it('passes a flag for every answer the CLI names one for', () => {
    const named = Object.values(ANSWERS)
      .flatMap((record) => {
        return 'flag' in record ? [`--${record.flag}`] : [];
      });
    const passed = new Set([
      ...answerFlags({
        ...DEFAULT_ANSWERS,
        target: 'react',
        form: 'tanstack-form',
        router: 'react-router',
        store: 'zustand',
        styling: 'tailwind',
        data: 'tanstack-query',
        mocking: 'msw',
        languages: ['en', 'ar'],
      }),
      ...answerFlags({
        ...DEFAULT_ANSWERS,
        target: 'webextension',
        hostedFramework: 'react',
        surfaces: ['popup'],
      }),
    ]);

    const unpassed = named
      .filter((flag) => {
        return !passed.has(flag);
      });

    expect(unpassed).toEqual([]);
  });
});

describe('versionFrom', () => {
  it('reads the first line, past the notice npm appends', () => {
    expect(versionFrom('npm', ANSWERED['npm'] ?? '')).toBe('11.0.0');
  });

  it('refuses a spawn error rather than injecting it as a version', () => {
    expect(() => {
      return versionFrom('bun', 'spawn bun ENOENT');
    }).toThrow('bun --version answered spawn bun ENOENT');
  });

  it('refuses a yarn 1 on PATH', () => {
    expect(() => {
      return versionFrom('yarn', '1.22.22');
    }).toThrow('The yarn on PATH is 1.22.22, which cannot run the yarn cases: put one at 4.0.0 or above');
  });

  it('takes a yarn 4', () => {
    expect(versionFrom('yarn', '4.18.0')).toBe('4.18.0');
  });
});

describe('managersToRun', () => {
  it('runs every manager this machine answers for when E2E_PM is unset', async () => {
    await expect(managersToRun(undefined)).resolves.toEqual([
      'pnpm',
      'npm',
    ]);
  });

  it('runs only the manager E2E_PM names', async () => {
    await expect(managersToRun('npm')).resolves.toEqual(['npm']);
  });

  it.each([
    ['yarn', 'The yarn on PATH is 1.22.22'],
    ['bun', 'bun --version answered'],
    ['pnp', 'E2E_PM is pnp, and is one of pnpm, npm, yarn, bun or unset'],
  ])('refuses E2E_PM=%s', async (requested, message) => {
    await expect(managersToRun(requested)).rejects.toThrow(message);
  });
});
