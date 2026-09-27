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
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-managed-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const record = async (text: string): Promise<void> => {
  await mkdir(dirname(join(cwd, MANAGED_PATH)), { recursive: true });
  await writeFile(join(cwd, MANAGED_PATH), text, 'utf8');
};

describe('managedPathsReader', () => {
  it('reads the paths a previous run recorded', async () => {
    await record('{ "removable": [".claude/settings.json"] }');

    await expect(managedPathsReader(cwd)).resolves.toEqual(['.claude/settings.json']);
  });

  it('answers nothing when there is no record', async () => {
    await expect(managedPathsReader(cwd)).resolves.toEqual([]);
  });

  it('answers nothing for a record that is not json', async () => {
    await record('{ not json');

    await expect(managedPathsReader(cwd)).resolves.toEqual([]);
  });

  it.each([
    ['an array', '[]'],
    ['a string', '"nope"'],
    ['an object with no list', '{ "removable": "everything" }'],
  ])('answers nothing for a record that is %s', async (_case, text) => {
    await record(text);

    await expect(managedPathsReader(cwd)).resolves.toEqual([]);
  });

  it('keeps only the entries that are strings', async () => {
    await record('{ "removable": ["a.js", 7, null, "b.js"] }');

    await expect(managedPathsReader(cwd)).resolves.toEqual(['a.js', 'b.js']);
  });
});
