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

import { readIfPresent } from '../../../utils/fsUtils';

import { projectFileWriter } from './projectFileUtils';

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
  it('closes every file it opens', async () => {
    const before = (await readdir('/dev/fd')).length;

    for (const text of [
      'one\n',
      'two\n',
      'three\n',
    ]) {
      await projectFileWriter(cwd, 'file.txt', text);
    }

    const entries = await readdir('/dev/fd');
    expect(entries).toHaveLength(before);
  });

  it('creates parent directories and overwrites a regular file', async () => {
    await projectFileWriter(cwd, 'nested/file.txt', 'first\n');
    await projectFileWriter(cwd, 'nested/file.txt', 'second\n');

    const file = await readFile(join(cwd, 'nested/file.txt'), 'utf8');
    expect(file).toBe('second\n');
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

    const projectFilePromise = projectFileWriter(cwd, 'generated.txt', 'generated\n');

    await expect(projectFilePromise)
      .rejects.toThrow('Refusing to write generated.txt: target is a symbolic link');

    const actual = await readlink(target);
    expect(actual).toBe(external);
    const file = await readIfPresent(external);
    expect(file).toBe(original);
  });

  it('refuses a symbolic-link parent without touching its destination', async () => {
    const external = join(cwd, 'external');

    await mkdir(external);
    await symlink(external, join(cwd, 'nested'));

    const projectFilePromise = projectFileWriter(cwd, 'nested/generated.txt', 'generated\n');

    await expect(projectFilePromise)
      .rejects.toThrow('Refusing to use nested/generated.txt: a parent directory is a symbolic link');

    const file = await readIfPresent(join(external, 'generated.txt'));
    expect(file).toBeNull();
  });

  it.each([
    ['an absolute path', (root: string) => {
      return join(root, 'outside.txt');
    }],
    ['a parent traversal', () => {
      return '../outside.txt';
    }],
  ])('refuses %s', async (_case, targetFor) => {
    const projectFilePromise = projectFileWriter(cwd, targetFor(cwd), 'generated\n');

    await expect(projectFilePromise)
      .rejects.toThrow('target must be a relative path inside the project');
  });

  it('surfaces a non-symbolic-link write failure unchanged', async () => {
    await mkdir(join(cwd, 'generated.txt'));

    const projectFilePromise = projectFileWriter(cwd, 'generated.txt', 'generated\n');
    await expect(projectFilePromise).rejects.toThrow(/EISDIR/);
  });
});
