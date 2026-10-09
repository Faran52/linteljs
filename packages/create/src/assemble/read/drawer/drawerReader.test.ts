import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { drawerReader } from './drawerReader';

const BASE = 'frameworks/react/any/base';

describe('drawerReader', () => {
  let root = '';

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'drawer-reader-');

    root = await mkdtemp(prefix);
  });

  afterEach(async () => {
    await rm(root, {
      recursive: true,
      force: true,
    });
  });

  it('reads the files and the share, tests kept', async () => {
    const drawn = await drawerReader(DRAWERS_ROOT, BASE, true);
    const paths = drawn.files
      .map((file) => {
        return file.path;
      });
    const [first] = drawn.files;
    const expectedSource = join(DRAWERS_ROOT, BASE, 'src', 'main.test.txt');

    expect(drawn.name).toBe(BASE);
    expect(paths).toEqual([join('src', 'main.test.txt'), join('src', 'main.txt')]);
    expect(first?.source).toBe(expectedSource);
    expect(drawn.share).toHaveProperty('eslint', { react: true });
  });

  it('leaves the tests out when the project has none', async () => {
    const drawn = await drawerReader(DRAWERS_ROOT, BASE, false);
    const paths = drawn.files
      .map((file) => {
        return file.path;
      });

    expect(paths).toEqual([join('src', 'main.txt')]);
  });

  it('reads a drawer with files only as an empty share', async () => {
    await mkdir(join(root, 'files'));
    await writeFile(join(root, 'files', 'a.txt'), 'a', 'utf8');

    const drawn = await drawerReader(root, 'files', true);

    expect(drawn.share).toEqual({});
  });

  it('refuses a share that is not an object', async () => {
    await mkdir(join(root, 'bad'));
    await writeFile(join(root, 'bad', 'share.json'), '[]', 'utf8');

    const reading = drawerReader(root, 'bad', true);

    await expect(reading).rejects.toThrow('bad/share.json is not an object');
  });
});
