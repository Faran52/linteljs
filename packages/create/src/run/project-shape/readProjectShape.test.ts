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

import { readProjectShape } from './readProjectShape';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-shape-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const plant = async (relative: string): Promise<void> => {
  await mkdir(join(cwd, relative, '..'), { recursive: true });
  await writeFile(join(cwd, relative), '', 'utf8');
};

describe('readProjectShape', () => {
  it('reads an empty directory as a project holding none of them', async () => {
    expect(await readProjectShape(cwd)).toEqual({
      setupTests: [],
      styleEntries: [],
    });
  });

  it('answers every spelling the project has, in candidate order', async () => {
    await plant('__mocks__/setupTests.ts');
    await plant('src/style.css');
    await plant('src/styles/global.css');

    expect(await readProjectShape(cwd)).toEqual({
      setupTests: ['__mocks__/setupTests.ts'],
      styleEntries: ['src/styles/global.css', 'src/style.css'],
    });
  });
});
