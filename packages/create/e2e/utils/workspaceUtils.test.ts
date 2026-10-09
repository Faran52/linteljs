import {
  existsSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { answersFor } from '@mocks/answersFor';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { PackageManager } from '@config/types';
import type { RunResult } from './processUtils';

const { run, runPm } = vi.hoisted(() => {
  const mocks = {
    run: vi.fn<() => Promise<RunResult>>(),
    runPm: vi.fn<(pm: PackageManager) => Promise<RunResult>>(),
  };

  return mocks;
});

vi.mock('./processUtils', async (importOriginal) => {
  const original = await importOriginal<typeof import('./processUtils')>();

  const mocked = {
    ...original,
    run,
    runPm,
  };

  return mocked;
});

const printed = (output: string): RunResult => {
  const result = {
    status: 0,
    output,
  };

  return result;
};

// Fresh per test: `versionOf` caches what it read.
const load = async () => {
  vi.resetModules();

  return import('./workspaceUtils');
};

beforeEach(() => {
  run.mockReset();
  runPm.mockReset();
});

afterEach(async () => {
  const { afterAllCleanup } = await import('./workspaceUtils');

  await afterAllCleanup();
});

describe('workspace', () => {
  it('is a fresh directory the cleanup removes', async () => {
    const { afterAllCleanup, workspace } = await load();

    const made = existsSync(workspace);
    expect(made).toBe(true);
    expect(workspace).toContain('linteljs-e2e-');
    await afterAllCleanup();
    const removed = existsSync(workspace);
    expect(removed).toBe(false);
  });
});

describe('versionOf', () => {
  it('reads the first line once per manager', async () => {
    runPm.mockResolvedValue(printed('10.26.0\na new version is out\n'));
    const { versionOf } = await load();

    const first = await versionOf('pnpm');
    const second = await versionOf('pnpm');
    expect(first).toBe('10.26.0');
    expect(second).toBe('10.26.0');
    expect(runPm).toHaveBeenCalledTimes(1);
    expect(runPm).toHaveBeenCalledWith('pnpm', ['--version'], expect.any(String));
  });

  it('refuses an answer that is not a version', async () => {
    runPm.mockResolvedValue(printed('spawn npm ENOENT'));
    const { versionOf } = await load();

    const read = versionOf('npm');

    await expect(read).rejects.toThrow('npm --version answered spawn npm ENOENT');
  });

  it('refuses a yarn below the floor', async () => {
    runPm.mockResolvedValue(printed('1.22.22'));
    const { versionOf } = await load();

    const read = versionOf('yarn');

    await expect(read).rejects.toThrow('The yarn on PATH is 1.22.22, which cannot run the yarn '
      + 'cases: put one at 4.0.0 or above first on PATH.');
  });
});

describe('managersToRun', () => {
  it('runs every manager the machine answers for when none is asked', async () => {
    runPm
      .mockImplementation((pm) => {
        const answered = printed(pm === 'pnpm' || pm === 'bun' ? '1.2.3' : 'not found');

        return Promise.resolve(answered);
      });

    const { managersToRun } = await load();

    const actual = await managersToRun(undefined);
    expect(actual).toEqual(['pnpm', 'bun']);
  });

  it('runs the one asked, once its version reads', async () => {
    runPm.mockResolvedValue(printed('11.0.0'));
    const { managersToRun } = await load();

    const actual = await managersToRun('npm');
    expect(actual).toEqual(['npm']);
    expect(runPm).toHaveBeenCalledWith('npm', ['--version'], expect.any(String));
  });

  it('refuses a manager it does not know', async () => {
    const { managersToRun } = await load();

    const asked = managersToRun('deno');

    await expect(asked).rejects.toThrow('E2E_PM is deno, and is one of pnpm, npm, yarn, bun or unset');
  });
});

describe('answerFlags', () => {
  it('passes the workspace answers, then the one project\'s, leaving out what is unset', async () => {
    const { answerFlags } = await load();
    const answers = answersFor({
      store: 'zustand',
      languages: ['en', 'ar'],
    });

    const actual = answerFlags(answers);

    expect(actual).toEqual([
      '--type-safety',
      answers.typeSafety,
      '--agents',
      answers.agents.join(','),
      '--plugins',
      answers.plugins.join(','),
      '--layout',
      answers.layout,
      '--target',
      answers.target,
      '--testing',
      answers.testing,
      '--libraries',
      answers.libraries.join(','),
      '--store',
      'zustand',
      '--languages',
      'en,ar',
    ]);
  });

  it('names the browser, the hosted framework, the surfaces and the rest when set', async () => {
    const { answerFlags } = await load();
    const answers = answersFor({
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
      surfaces: ['popup'],
      form: 'react-hook-form',
      router: 'react-router',
      styling: 'tailwind',
      data: 'tanstack-query',
      mocking: 'msw',
    });

    const actual = answerFlags(answers)
      .slice(14);

    expect(actual).toEqual([
      '--browser',
      'firefox',
      '--hosted',
      'solid',
      '--surfaces',
      'popup',
      '--form',
      'react-hook-form',
      '--router',
      'react-router',
      '--styling',
      'tailwind',
      '--data',
      'tanstack-query',
      '--mocking',
      'msw',
    ]);
  });

  it('groups each project under its name, a package by its kind alone', async () => {
    const { answerFlags } = await load();
    const app = answersFor({ layout: 'monorepo' });
    const library = answersFor({ target: 'typescript' });

    const actual = answerFlags(app, [{
      name: 'web',
      answers: app,
    }, {
      name: 'core',
      answers: library,
    }]);

    const grouped = actual.slice(8);

    expect(grouped).toEqual([
      '--project',
      'web',
      '--target',
      app.target,
      '--testing',
      app.testing,
      '--libraries',
      app.libraries.join(','),
      '--project',
      'core',
      '--kind',
      'package',
    ]);
  });
});

describe('createProject', () => {
  it('runs the CLI in a made root as the manager\'s agent', async () => {
    runPm.mockResolvedValue(printed('10.26.0'));
    run.mockResolvedValue(printed('done'));
    const { answerFlags, createProject } = await load();
    const { registry } = await import('./processUtils');
    const prefix = join(tmpdir(), 'linteljs-create-');
    const parent = mkdtempSync(prefix);
    const root = join(parent, 'nested');
    const answers = answersFor();

    const actual = await createProject(root, 'demo', answers, ['--no-install']);
    const done = printed('done');

    expect(actual).toEqual(done);
    const made = existsSync(root);
    expect(made).toBe(true);

    const flags = answerFlags(answers);

    expect(run).toHaveBeenCalledWith('node', [
      registry.cliBin,
      'demo',
      ...flags,
      '--no-install',
    ], root, 'pnpm/10.26.0 npm/? node/? e2e');

    rmSync(parent, {
      recursive: true,
      force: true,
    });
  });
});
