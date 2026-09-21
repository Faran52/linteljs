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

  it('settles on a clean exit with its output captured, saying nothing itself', async () => {
    await expect(runSpawn('node', ['-e', 'console.log("scaffolded")'], cwd, 'capture'))
      .resolves.toBeUndefined();
  });

  /**
   * What the binary printed is the whole of why it failed, and on a terminal nobody has seen it: the spinner owns
   * the line precisely because this output never reached it.
   */
  it('carries what a captured command printed on both streams into the failure', async () => {
    const failing = runSpawn(
      'node',
      ['-e', 'console.log("resolving"); console.error("ERR_PNPM_NO_MATCHING_VERSION"); process.exit(1)'],
      cwd,
      'capture',
    );

    await expect(failing).rejects.toThrow(/resolving/u);
    await expect(failing).rejects.toThrow(/ERR_PNPM_NO_MATCHING_VERSION/u);
  });
});
