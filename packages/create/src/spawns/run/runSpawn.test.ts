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
    await expect(runSpawn('node', ['-e', 'process.exit(2)'], cwd))
      .rejects.toThrow(/^node -e process\.exit\(2\) exited with 2$/u);
  });

  // Inherited output went straight to the terminal, so the failure is the command and its status alone.
  it('leaves what an inherited command printed out of the failure', async () => {
    await expect(runSpawn('node', ['-e', 'console.log("in" + "herited"); process.exit(1)'], cwd))
      .rejects.toThrow(/exited with 1$/u);
  });

  // Angular's CLI otherwise stops to ask about analytics, with no flag to decline.
  it("tells Angular's CLI to skip its analytics prompt", async () => {
    await expect(runSpawn('node', ['-e', 'process.exit(process.env.NG_CLI_ANALYTICS === "false" ? 0 : 1)'], cwd))
      .resolves.toBeUndefined();
  });

  it('lets yarn write the lockfile a first install creates, even under CI', async () => {
    const script = 'process.exit(process.env.YARN_ENABLE_IMMUTABLE_INSTALLS === "false" ? 0 : 1)';

    await expect(runSpawn('node', ['-e', script], cwd)).resolves.toBeUndefined();
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
    // Built at run time, so the text can only reach the message through the output and never through the args.
    const failing = runSpawn(
      'node',
      ['-e', 'console.log("resol" + "ving"); console.error("ERR_" + "NO_MATCH"); process.exit(1)'],
      cwd,
      'capture',
    );

    await expect(failing).rejects.toThrow(/exited with 1\n(?:resolving\nERR_NO_MATCH|ERR_NO_MATCH\nresolving)\n$/u);
  });

  // Closed rather than inherited: a command that waits on its input would otherwise wait on nobody.
  it("closes a captured command's input, so nothing can stop to ask", async () => {
    const waiting = 'process.stdin.resume(); process.stdin.on("end", () => process.exit(0))';

    await expect(runSpawn('node', ['-e', waiting], cwd, 'capture')).resolves.toBeUndefined();
  });
});
