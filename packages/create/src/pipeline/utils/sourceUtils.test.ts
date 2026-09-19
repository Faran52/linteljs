import {
  mkdir,
  mkdtemp,
  rm,
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

import { sourceFiles } from './sourceUtils';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-source-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('sourceFiles', () => {
  it('reads a missing root as nothing to rewrite', async () => {
    await expect(sourceFiles(join(cwd, 'src'))).resolves.toEqual([]);
  });

  // Only absence is data; anything else stays an error.
  it('rethrows a failure that is not absence', async () => {
    await mkdir(join(cwd, 'src', '..'), { recursive: true });
    await writeFile(join(cwd, 'src'), '', 'utf8');

    await expect(sourceFiles(join(cwd, 'src'))).rejects.toThrow();
  });

  it('answers every script file under the root and nothing else', async () => {
    await mkdir(join(cwd, 'src/nested'), { recursive: true });

    for (const path of ['src/main.ts', 'src/App.tsx', 'src/nested/thing.mts', 'src/styles.css']) {
      await writeFile(join(cwd, path), '', 'utf8');
    }

    const found = (await sourceFiles(join(cwd, 'src'))).map((path) => {
      return path.slice(cwd.length + 1);
    });

    expect(found.toSorted((left, right) => {
      return left.localeCompare(right);
    })).toEqual(['src/App.tsx', 'src/main.ts', 'src/nested/thing.mts']);
  });
});
