import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { runSpawn } from './runSpawn';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-run-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('runSpawn', () => {
  it('settles once the command has exited cleanly', async () => {
    await expect(runSpawn('node', ['-e', 'process.exit(0)'], cwd)).resolves.toBeUndefined();
  });

  // The command and its status, because the failure is read three callers up where neither is in scope.
  it('rejects with the command and the status it failed on', async () => {
    await expect(runSpawn('node', ['-e', 'process.exit(2)'], cwd)).rejects.toThrow(/exited with 2$/u);
  });
});
