import {
  chmod,
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

import { localBinarySpawn } from './localBinarySpawn';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-local-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('localBinarySpawn', () => {
  // Before `install` has run there is nothing there to fix, so absence is not a failure to report.
  it('answers null where the project has installed nothing', () => {
    expect(localBinarySpawn(cwd, 'probe', ['--version'])).toBeNull();
  });

  it('answers the exit status and output of the binary the project installed', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\necho ok\nexit 3\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    expect(localBinarySpawn(cwd, 'probe', [])).toEqual({
      status: 3,
      stdout: 'ok\n',
      failed: false,
    });
  });
});
