import {
  mkdir,
  mkdtemp,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGED_PATH } from '../config/managed';

import { readManagedPaths } from './readManagedPaths';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-managed-'));
});

const record = async (text: string): Promise<void> => {
  await mkdir(dirname(join(cwd, MANAGED_PATH)), { recursive: true });
  await writeFile(join(cwd, MANAGED_PATH), text, 'utf8');
};

/**
 * Every unreadable shape answers nothing rather than throwing, and nothing is the safe direction: `sync` then adds
 * what the answers ask for and removes none of what they no longer do. Throwing would stop a sync over bookkeeping
 * the same run is about to rewrite.
 */
describe('readManagedPaths', () => {
  it('reads the paths a previous run recorded', async () => {
    await record('{ "removable": [".claude/settings.json"] }');

    await expect(readManagedPaths(cwd)).resolves.toEqual(['.claude/settings.json']);
  });

  // A project written before this file existed.
  it('answers nothing when there is no record', async () => {
    await expect(readManagedPaths(cwd)).resolves.toEqual([]);
  });

  it('answers nothing for a record that is not json', async () => {
    await record('{ not json');

    await expect(readManagedPaths(cwd)).resolves.toEqual([]);
  });

  it.each([
    ['an array', '[]'],
    ['a string', '"nope"'],
    ['an object with no list', '{ "removable": "everything" }'],
  ])('answers nothing for a record that is %s', async (_case, text) => {
    await record(text);

    await expect(readManagedPaths(cwd)).resolves.toEqual([]);
  });

  // A hand-edited record keeps the entries that are still paths rather than failing whole.
  it('keeps only the entries that are strings', async () => {
    await record('{ "removable": ["a.js", 7, null, "b.js"] }');

    await expect(readManagedPaths(cwd)).resolves.toEqual(['a.js', 'b.js']);
  });
});
