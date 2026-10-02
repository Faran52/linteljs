import {
  chmod,
  mkdir,
  mkdtemp,
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

import {
  allPresent,
  entryExists,
  exists,
  globSnapshot,
  hasCode,
  isExecutableFile,
  readIfPresent,
  rmdirIfEmpty,
} from './fsUtils';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-fs-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('hasCode', () => {
  it('recognises only an error carrying that code', () => {
    const actual = hasCode(Object.assign(new Error('gone'), { code: 'ENOENT' }), 'ENOENT');
    expect(actual).toBe(true);
    const actual2 = hasCode(Object.assign(new Error('denied'), { code: 'EACCES' }), 'ENOENT');
    expect(actual2).toBe(false);
    const actual3 = hasCode(new Error('no code at all'), 'ENOENT');
    expect(actual3).toBe(false);
    const actual4 = hasCode('not even an error', 'ENOENT');
    expect(actual4).toBe(false);
    const actual5 = hasCode({ code: 'ENOENT' }, 'ENOENT');
    expect(actual5).toBe(false);
  });
});

describe('isExecutableFile', () => {
  it('takes an executable file and refuses a plain one, a directory and absence', async () => {
    await writeFile(join(cwd, 'tool'), '', 'utf8');
    await chmod(join(cwd, 'tool'), 0o755);
    await writeFile(join(cwd, 'plain.txt'), '', 'utf8');

    const toolIsExecutableFile = isExecutableFile(join(cwd, 'tool'));
    expect(toolIsExecutableFile).toBe(true);
    const plainTxtIsExecutableFile = isExecutableFile(join(cwd, 'plain.txt'));
    expect(plainTxtIsExecutableFile).toBe(false);
    const cwdIsExecutableFile = isExecutableFile(cwd);
    expect(cwdIsExecutableFile).toBe(false);
    const absentIsExecutableFile = isExecutableFile(join(cwd, 'absent'));
    expect(absentIsExecutableFile).toBe(false);
  });
});

describe('exists', () => {
  it('answers true for a file and for the directory holding it', async () => {
    await writeFile(join(cwd, 'present.txt'), 'text\n', 'utf8');

    const presentTxtExists = await exists(join(cwd, 'present.txt'));
    expect(presentTxtExists).toBe(true);
    const cwdExists = await exists(cwd);
    expect(cwdExists).toBe(true);
  });

  it('answers false for absence, which is what the guards it replaces asked', async () => {
    const absentTxtExists = await exists(join(cwd, 'absent.txt'));
    expect(absentTxtExists).toBe(false);
  });
});

describe('entryExists', () => {
  it('sees live and dangling symlink directory entries without following them', async () => {
    await writeFile(join(cwd, 'target.txt'), 'text\n', 'utf8');
    await symlink('target.txt', join(cwd, 'live.txt'));
    await symlink('missing.txt', join(cwd, 'dangling.txt'));

    const actual = await entryExists(join(cwd, 'live.txt'));
    expect(actual).toBe(true);
    const actual2 = await entryExists(join(cwd, 'dangling.txt'));
    expect(actual2).toBe(true);
    const actual3 = await entryExists(join(cwd, 'absent.txt'));
    expect(actual3).toBe(false);
  });

  it('rethrows a failure that is not absence', async () => {
    await writeFile(join(cwd, 'file.txt'), 'text\n', 'utf8');

    const promise = entryExists(join(cwd, 'file.txt', 'below.txt'));
    await expect(promise).rejects.toThrow();
  });
});

describe('readIfPresent', () => {
  it('reads a file that exists', async () => {
    await writeFile(join(cwd, 'present.txt'), 'text\n', 'utf8');

    const file = await readIfPresent(join(cwd, 'present.txt'));
    expect(file).toBe('text\n');
  });

  it('reads absence as null, which is the merge input for a fresh project', async () => {
    const file = await readIfPresent(join(cwd, 'absent.txt'));
    expect(file).toBeNull();
  });

  it('rethrows a failure that is not absence', async () => {
    const filePromise = readIfPresent(cwd);
    await expect(filePromise).rejects.toThrow();
  });
});

describe('rmdirIfEmpty', () => {
  it('removes an empty directory', async () => {
    await mkdir(join(cwd, 'empty'));

    await rmdirIfEmpty(join(cwd, 'empty'));

    const emptyExists = await exists(join(cwd, 'empty'));
    expect(emptyExists).toBe(false);
  });

  it('keeps a directory that still holds something', async () => {
    await mkdir(join(cwd, 'full'));
    await writeFile(join(cwd, 'full/kept.txt'), '', 'utf8');

    await rmdirIfEmpty(join(cwd, 'full'));

    const fullKeptTxtExists = await exists(join(cwd, 'full/kept.txt'));
    expect(fullKeptTxtExists).toBe(true);
  });

  it('rethrows a failure that is not a directory in use, absence included', async () => {
    const promise = rmdirIfEmpty(join(cwd, 'absent'));
    await expect(promise).rejects.toThrow('ENOENT');
  });
});

describe('allPresent', () => {
  const CANDIDATES = ['a.tsx', 'a.ts'];

  it('answers nothing when none of them is there', async () => {
    const actual = await allPresent(cwd, CANDIDATES);
    expect(actual).toEqual([]);
  });

  it('answers every candidate that exists, in the order given', async () => {
    await writeFile(join(cwd, 'a.ts'), '', 'utf8');

    const actual = await allPresent(cwd, CANDIDATES);
    const expected = ['a.ts'];
    expect(actual).toEqual(expected);

    await writeFile(join(cwd, 'a.tsx'), '', 'utf8');

    const actual2 = await allPresent(cwd, CANDIDATES);
    const expected2 = ['a.tsx', 'a.ts'];
    expect(actual2).toEqual(expected2);
  });
});

describe('globSnapshot', () => {
  it('answers nothing when nothing matches', async () => {
    const actual = await globSnapshot(cwd, 'src/**/*.css');
    expect(actual).toEqual([]);
  });

  it('pairs every match under the directory with its content, and skips what does not match', async () => {
    await mkdir(join(cwd, 'src', 'nested'), { recursive: true });
    await writeFile(join(cwd, 'src', 'nested', 'a.css'), 'a {}', 'utf8');
    await writeFile(join(cwd, 'src', 'b.ts'), 'b', 'utf8');

    const actual = await globSnapshot(cwd, 'src/**/*.css');
    const expected = [`${join('src', 'nested', 'a.css')}\0a {}`];
    expect(actual).toEqual(expected);
  });
});
