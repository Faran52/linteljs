import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rm,
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

import { readIfPresent } from '../../utils/fsUtils';

import { projectFileWriter } from './projectFileWriter';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-project-file-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('projectFileWriter', () => {
  // A descriptor left open lingers until garbage collection, and a run writes dozens of files.
  it('closes every file it opens', async () => {
    const before = (await readdir('/dev/fd')).length;

    for (const text of ['one\n', 'two\n', 'three\n']) {
      await projectFileWriter(cwd, 'file.txt', text);
    }

    expect(await readdir('/dev/fd')).toHaveLength(before);
  });

  it('creates parent directories and overwrites a regular file', async () => {
    await projectFileWriter(cwd, 'nested/file.txt', 'first\n');
    await projectFileWriter(cwd, 'nested/file.txt', 'second\n');

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

    await expect(projectFileWriter(cwd, 'generated.txt', 'generated\n'))
      .rejects.toThrow('Refusing to write generated.txt: target is a symbolic link');
    await expect(readlink(target)).resolves.toBe(external);
    await expect(readIfPresent(external)).resolves.toBe(original);
  });

  it('refuses a symbolic-link parent without touching its destination', async () => {
    const external = join(cwd, 'external');

    await mkdir(external);
    await symlink(external, join(cwd, 'nested'));

    await expect(projectFileWriter(cwd, 'nested/generated.txt', 'generated\n'))
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
    await expect(projectFileWriter(cwd, targetFor(cwd), 'generated\n'))
      .rejects.toThrow('target must be a relative path inside the project');
  });

  it('surfaces a non-symbolic-link write failure unchanged', async () => {
    await mkdir(join(cwd, 'generated.txt'));

    await expect(projectFileWriter(cwd, 'generated.txt', 'generated\n')).rejects.toThrow(/EISDIR/);
  });
});
