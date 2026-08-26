import {
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  stat,
  symlink,
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

import { emitted, merged } from '../../artifacts/artifact/artifact';
import { readIfPresent } from '../utils/fsUtils';

import { applyArtifact, writeProjectFile } from './projectFiles';

import type { Artifact } from '../../artifacts';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-project-files-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('writeProjectFile', () => {
  it('creates parent directories and overwrites a regular file', async () => {
    await writeProjectFile(cwd, 'nested/file.txt', 'first\n');
    await writeProjectFile(cwd, 'nested/file.txt', 'second\n');

    await expect(readFile(join(cwd, 'nested/file.txt'), 'utf8')).resolves.toBe('second\n');
  });

  it.each([
    ['live', '// external config\n'],
    ['dangling', null],
  ])('refuses an existing %s symbolic link without touching its destination', async (_case, original) => {
    const external = join(cwd, 'external.txt');
    const target = join(cwd, 'generated.txt');

    if (original !== null) {
      await writeFile(external, original, 'utf8');
    }

    await symlink(external, target);

    await expect(writeProjectFile(cwd, 'generated.txt', 'generated\n'))
      .rejects.toThrow('Refusing to write generated.txt: target is a symbolic link');
    await expect(readlink(target)).resolves.toBe(external);
    await expect(readIfPresent(external)).resolves.toBe(original);
  });

  it('refuses a symbolic-link parent without touching its destination', async () => {
    const external = join(cwd, 'external');

    await mkdir(external);
    await symlink(external, join(cwd, 'nested'));

    await expect(writeProjectFile(cwd, 'nested/generated.txt', 'generated\n'))
      .rejects.toThrow('Refusing to use nested/generated.txt: a parent directory is a symbolic link');
    await expect(readIfPresent(join(external, 'generated.txt'))).resolves.toBeNull();
  });

  it.each([
    ['an absolute path', (root: string) => {
      return join(root, 'outside.txt');
    }],
    ['a parent traversal', () => {
      return '../outside.txt';
    }],
  ])('refuses %s', async (_case, targetFor) => {
    await expect(writeProjectFile(cwd, targetFor(cwd), 'generated\n'))
      .rejects.toThrow('target must be a relative path inside the project');
  });

  it('surfaces a non-symbolic-link write failure unchanged', async () => {
    await mkdir(join(cwd, 'generated.txt'));

    await expect(writeProjectFile(cwd, 'generated.txt', 'generated\n')).rejects.toThrow(/EISDIR/);
  });
});

describe('applyArtifact', () => {
  it('leaves an existing preserved artifact alone and reports no write', async () => {
    await writeFile(join(cwd, 'kept.txt'), 'project\n', 'utf8');

    const artifact = {
      ...emitted('standard', 'kept.txt', 'shipped\n'),
      preserve: true,
    } satisfies Artifact;

    await expect(applyArtifact(cwd, artifact)).resolves.toBe(false);
    await expect(readFile(join(cwd, 'kept.txt'), 'utf8')).resolves.toBe('project\n');
  });

  it('gives a merged artifact the current file and reports its write', async () => {
    await writeFile(join(cwd, 'settings.json'), 'current\n', 'utf8');

    const artifact = merged('standard', 'settings.json', (current) => {
      return `${current ?? ''}merged\n`;
    });

    await expect(applyArtifact(cwd, artifact)).resolves.toBe(true);
    await expect(readFile(join(cwd, 'settings.json'), 'utf8'))
      .resolves.toBe('current\nmerged\n');
  });

  it('makes an executable artifact executable', async () => {
    const artifact = {
      ...emitted('standard', 'hook.sh', '#!/bin/sh\n'),
      executable: true,
    } satisfies Artifact;

    await expect(applyArtifact(cwd, artifact)).resolves.toBe(true);
    expect((await stat(join(cwd, 'hook.sh'))).mode & 0o111).toBe(0o111);
  });
});
