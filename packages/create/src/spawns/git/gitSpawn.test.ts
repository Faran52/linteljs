import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { exists } from '@disk';

import { gitSpawn } from './gitSpawn';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-git-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('gitSpawn', () => {
  it('runs the command in the given working directory', async () => {
    const result = gitSpawn(['init'], { cwd });

    expect(result.status).toBe(0);
    expect(await exists(join(cwd, '.git'))).toBe(true);
  });

  it('acts on the given directory when the caller exports another repository', async () => {
    const outer = await mkdtemp(join(tmpdir(), 'linteljs-git-outer-'));

    try {
      gitSpawn(['init', '--quiet'], { cwd: outer });
      // What a linked worktree's `git rebase --exec` exports.
      vi.stubEnv('GIT_DIR', join(outer, '.git'));

      const result = gitSpawn(['init', '--quiet'], { cwd });
      const outerBare = gitSpawn(['config', 'core.bare'], { cwd: outer });

      expect(result.status).toBe(0);
      expect(await exists(join(cwd, '.git'))).toBe(true);
      expect(outerBare).toHaveProperty('stdout', 'false\n');
    }
    finally {
      vi.unstubAllEnvs();

      await rm(outer, {
        recursive: true,
        force: true,
      });
    }
  });

  it('feeds the input option to the command on stdin', async () => {
    await writeFile(join(cwd, 'a.txt'), 'one\n', 'utf8');

    const result = gitSpawn(
      [
        'diff',
        '--no-index',
        '--no-color',
        '--',
        'a.txt',
        '-',
      ],
      {
        cwd,
        input: 'two\n',
      },
    );

    expect(result).toHaveProperty('stdout', expect.stringContaining('-one'));
    expect(result).toHaveProperty('stdout', expect.stringContaining('+two'));
  });

  it('reports a failing command through its exit status rather than throwing', () => {
    expect(() => {
      return gitSpawn(['not-a-real-subcommand'], { cwd });
    }).not.toThrow();

    const result = gitSpawn(['not-a-real-subcommand'], { cwd });

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
  });

  it('names the missing dependency when PATH holds no git', () => {
    vi.stubEnv('PATH', cwd);

    try {
      const result = gitSpawn(['init'], { cwd });

      expect(result.error?.message).toContain('git was not found on PATH');
      expect(result.status).toBeNull();
    }
    finally {
      vi.unstubAllEnvs();
    }
  });

  it('treats a missing PATH like an empty one', () => {
    vi.stubEnv('PATH', undefined);

    try {
      expect(gitSpawn(['init'], { cwd }).error?.message).toContain('git was not found on PATH');
    }
    finally {
      vi.unstubAllEnvs();
    }
  });
});
