import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGED_PATH } from '@config/constants';

import { managedPathsReader } from './managedPathsReader';

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-managed-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const record = async (text: string): Promise<void> => {
  const managedDirectory = dirname(join(cwd, MANAGED_PATH));
  await mkdir(managedDirectory, { recursive: true });
  await writeFile(join(cwd, MANAGED_PATH), text, 'utf8');
};

describe('managedPathsReader', () => {
  it('reads the paths a previous run recorded', async () => {
    await record('{ "removable": [".claude/settings.json"] }');

    const managedPaths = await managedPathsReader(cwd);
    const expected = ['.claude/settings.json'];
    expect(managedPaths).toEqual(expected);
  });

  it('answers nothing when there is no record', async () => {
    const managedPaths = await managedPathsReader(cwd);
    expect(managedPaths).toEqual([]);
  });

  it('answers nothing for a record that is not json', async () => {
    await record('{ not json');

    const managedPaths = await managedPathsReader(cwd);
    expect(managedPaths).toEqual([]);
  });

  it.each([
    ['an array', '[]'],
    ['a string', '"nope"'],
    ['an object with no list', '{ "removable": "everything" }'],
  ])('answers nothing for a record that is %s', async (_case, text) => {
    await record(text);

    const managedPaths = await managedPathsReader(cwd);
    expect(managedPaths).toEqual([]);
  });

  it('keeps only the entries that are strings', async () => {
    await record('{ "removable": ["a.js", 7, null, "b.js"] }');

    const managedPaths = await managedPathsReader(cwd);
    const expected = ['a.js', 'b.js'];
    expect(managedPaths).toEqual(expected);
  });
});
