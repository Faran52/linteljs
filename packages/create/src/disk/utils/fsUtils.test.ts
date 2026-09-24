import {
  chmod,
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
  isAbsence,
  isExecutableFile,
  readIfPresent,
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

describe('isAbsence', () => {
  it('recognises only the missing-path failure', () => {
    expect(isAbsence(Object.assign(new Error('gone'), { code: 'ENOENT' }))).toBe(true);
    expect(isAbsence(Object.assign(new Error('denied'), { code: 'EACCES' }))).toBe(false);
    expect(isAbsence(new Error('no code at all'))).toBe(false);
    expect(isAbsence('not even an error')).toBe(false);
  });
});

// A directory carries the execute bit too, so the mode alone would take one for a binary.
describe('isExecutableFile', () => {
  it('takes an executable file and refuses a plain one, a directory and absence', async () => {
    await writeFile(join(cwd, 'tool'), '', 'utf8');
    await chmod(join(cwd, 'tool'), 0o755);
    await writeFile(join(cwd, 'plain.txt'), '', 'utf8');

    expect(isExecutableFile(join(cwd, 'tool'))).toBe(true);
    expect(isExecutableFile(join(cwd, 'plain.txt'))).toBe(false);
    expect(isExecutableFile(cwd)).toBe(false);
    expect(isExecutableFile(join(cwd, 'absent'))).toBe(false);
  });
});

describe('exists', () => {
  it('answers true for a file and for the directory holding it', async () => {
    await writeFile(join(cwd, 'present.txt'), 'text\n', 'utf8');

    await expect(exists(join(cwd, 'present.txt'))).resolves.toBe(true);
    await expect(exists(cwd)).resolves.toBe(true);
  });

  it('answers false for absence, which is what the guards it replaces asked', async () => {
    await expect(exists(join(cwd, 'absent.txt'))).resolves.toBe(false);
  });
});

describe('entryExists', () => {
  it('sees live and dangling symlink directory entries without following them', async () => {
    await writeFile(join(cwd, 'target.txt'), 'text\n', 'utf8');
    await symlink('target.txt', join(cwd, 'live.txt'));
    await symlink('missing.txt', join(cwd, 'dangling.txt'));

    await expect(entryExists(join(cwd, 'live.txt'))).resolves.toBe(true);
    await expect(entryExists(join(cwd, 'dangling.txt'))).resolves.toBe(true);
    await expect(entryExists(join(cwd, 'absent.txt'))).resolves.toBe(false);
  });

  // ENOTDIR read as absence would let the pipeline overwrite a preserved file it decided was not there.
  it('rethrows a failure that is not absence', async () => {
    await writeFile(join(cwd, 'file.txt'), 'text\n', 'utf8');

    await expect(entryExists(join(cwd, 'file.txt', 'below.txt'))).rejects.toThrow();
  });
});

describe('readIfPresent', () => {
  it('reads a file that exists', async () => {
    await writeFile(join(cwd, 'present.txt'), 'text\n', 'utf8');

    await expect(readIfPresent(join(cwd, 'present.txt'))).resolves.toBe('text\n');
  });

  it('reads absence as null, which is the merge input for a fresh project', async () => {
    await expect(readIfPresent(join(cwd, 'absent.txt'))).resolves.toBeNull();
  });

  // A bare catch treating any failure as absence could make the pipeline overwrite an existing file on a corrupted
  // read; a directory at the path stays an error.
  it('rethrows a failure that is not absence', async () => {
    await expect(readIfPresent(cwd)).rejects.toThrow();
  });
});

// Every one, not the first: which spelling a project means is `projectSpelling`'s decision, not this list's order.
describe('allPresent', () => {
  const CANDIDATES = ['a.tsx', 'a.ts'];

  it('answers nothing when none of them is there', async () => {
    expect(await allPresent(cwd, CANDIDATES)).toEqual([]);
  });

  // Candidate order, not the filesystem's, so the caller reads the same list whatever order they were written in.
  it('answers every candidate that exists, in the order given', async () => {
    await writeFile(join(cwd, 'a.ts'), '', 'utf8');

    expect(await allPresent(cwd, CANDIDATES)).toEqual(['a.ts']);

    await writeFile(join(cwd, 'a.tsx'), '', 'utf8');

    expect(await allPresent(cwd, CANDIDATES)).toEqual(['a.tsx', 'a.ts']);
  });
});
