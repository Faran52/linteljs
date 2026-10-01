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

  it('rejects with the command and the status it failed on', async () => {
    await expect(runSpawn('node', ['-e', 'process.exit(2)'], cwd))
      .rejects.toThrow(/^node -e process\.exit\(2\) exited with 2$/u);
  });

  it('leaves what an inherited command printed out of the failure', async () => {
    await expect(runSpawn('node', ['-e', 'console.log("in" + "herited"); process.exit(1)'], cwd))
      .rejects.toThrow(/exited with 1$/u);
  });

  it("tells Angular's CLI to skip its analytics prompt", async () => {
    await expect(runSpawn('node', ['-e', 'process.exit(process.env.NG_CLI_ANALYTICS === "false" ? 0 : 1)'], cwd))
      .resolves.toBeUndefined();
  });

  it('lets yarn write the lockfile a first install creates, even under CI', async () => {
    const script = 'process.exit(process.env.YARN_ENABLE_IMMUTABLE_INSTALLS === "false" ? 0 : 1)';

    await expect(runSpawn('node', ['-e', script], cwd)).resolves.toBeUndefined();
  });

  it("keeps the caller's repository from the install, so husky's prepare finds this one", async () => {
    vi.stubEnv('GIT_DIR', '/elsewhere/.git');
    vi.stubEnv('LINTELJS_KEPT', 'yes');

    try {
      const script = 'process.exit(process.env.GIT_DIR === undefined && process.env.LINTELJS_KEPT === "yes" ? 0 : 1)';

      await expect(runSpawn('node', ['-e', script], cwd)).resolves.toBeUndefined();
    }
    finally {
      vi.unstubAllEnvs();
    }
  });

  it('settles on a clean exit with its output captured, saying nothing itself', async () => {
    await expect(runSpawn('node', ['-e', 'console.log("scaffolded")'], cwd, 'capture'))
      .resolves.toBeUndefined();
  });

  it('carries what a captured command printed on both streams into the failure', async () => {
    const failing = runSpawn(
      'node',
      ['-e', 'console.log("resol" + "ving"); console.error("ERR_" + "NO_MATCH"); process.exit(1)'],
      cwd,
      'capture',
    );

    await expect(failing).rejects.toThrow(/exited with 1\n(?:resolving\nERR_NO_MATCH|ERR_NO_MATCH\nresolving)\n$/u);
  });

  it("closes a captured command's input, so nothing can stop to ask", async () => {
    const waiting = 'process.stdin.resume(); process.stdin.on("end", () => process.exit(0))';

    await expect(runSpawn('node', ['-e', waiting], cwd, 'capture')).resolves.toBeUndefined();
  });
});
