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
  it('answers null where the project has installed nothing', async () => {
    const actual = await localBinarySpawn(cwd, 'probe', ['--version']);
    expect(actual).toBeNull();
  });

  it('answers the exit status and output of the binary the project installed', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\necho ok\nexit 3\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    const actual = await localBinarySpawn(cwd, 'probe', []);
    const expected = {
      status: 3,
      stdout: 'ok\n',
      failed: false,
    };
    expect(actual).toEqual(expected);
  });

  it('reports a binary it could not execute as failed rather than absent', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\necho ok\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o644);

    const actual = await localBinarySpawn(cwd, 'probe', []);
    const expected = { failed: true };
    expect(actual).toEqual(expected);
  });

  it('reads output that arrives in more than one piece as one', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\nprintf one\nsleep 0.2\nprintf two\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    const actual = await localBinarySpawn(cwd, 'probe', []);
    const expected = {
      failed: false,
      status: 0,
      stdout: 'onetwo',
    };
    expect(actual).toEqual(expected);
  });

  it("closes the binary's input, so one reading it cannot hang the run", async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\ncat > /dev/null\necho read\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    const actual = await localBinarySpawn(cwd, 'probe', []);
    const expected = {
      failed: false,
      status: 0,
      stdout: 'read\n',
    };
    expect(actual).toEqual(expected);
  });
});
