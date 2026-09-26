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
  it('answers null where the project has installed nothing', async () => {
    await expect(localBinarySpawn(cwd, 'probe', ['--version'])).resolves.toBeNull();
  });

  it('answers the exit status and output of the binary the project installed', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\necho ok\nexit 3\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    await expect(localBinarySpawn(cwd, 'probe', [])).resolves.toEqual({
      status: 3,
      stdout: 'ok\n',
      failed: false,
    });
  });

  // A binary that is there and will not run: the shim exists, the bit does not, and `spawn` never reaches `close`.
  it('reports a binary it could not execute as failed rather than absent', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\necho ok\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o644);

    await expect(localBinarySpawn(cwd, 'probe', [])).resolves.toEqual({ failed: true });
  });

  // Output arrives in as many chunks as the binary flushes, and the report is read whole.
  it('reads output that arrives in more than one piece as one', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\nprintf one\nsleep 0.2\nprintf two\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    await expect(localBinarySpawn(cwd, 'probe', [])).resolves.toEqual({
      failed: false,
      status: 0,
      stdout: 'onetwo',
    });
  });

  // Closed rather than inherited: a binary waiting on its input would otherwise wait on nobody.
  it("closes the binary's input, so one reading it cannot hang the run", async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'probe'), '#!/bin/sh\ncat > /dev/null\necho read\n', 'utf8');
    await chmod(join(bin, 'probe'), 0o755);

    await expect(localBinarySpawn(cwd, 'probe', [])).resolves.toEqual({
      failed: false,
      status: 0,
      stdout: 'read\n',
    });
  });
});
