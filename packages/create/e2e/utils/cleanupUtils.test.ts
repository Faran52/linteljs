import {
  existsSync,
  mkdtempSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { removedAfter } from './cleanupUtils';

const treeWithFile = (): string => {
  const prefix = join(tmpdir(), 'linteljs-cleanup-');
  const dir = mkdtempSync(prefix);

  writeFileSync(join(dir, 'file.txt'), '');

  return dir;
};

describe('removedAfter', () => {
  it('removes the tree once the work is done', async () => {
    const dir = treeWithFile();

    await removedAfter(dir, async () => {
      await Promise.resolve();
    });

    const isLeft = existsSync(dir);
    expect(isLeft).toBe(false);
  });

  it('removes the tree and rethrows when the work fails', async () => {
    const dir = treeWithFile();

    const failing = removedAfter(dir, async () => {
      await Promise.resolve();
      throw new Error('case failed');
    });

    await expect(failing).rejects.toThrow('case failed');

    const isLeft = existsSync(dir);
    expect(isLeft).toBe(false);
  });
});
