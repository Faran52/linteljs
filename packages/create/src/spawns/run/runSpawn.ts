import { spawn } from 'node:child_process';
import { env } from 'node:process';

import type { RunOutput } from '#config/types';

/**
 * Asynchronous on purpose: a `spawnSync` install blocks the event loop, which serialises a whole end-to-end file
 * however wide its concurrency is set.
 *
 * `capture` hands the binary's own output back on a failure rather than writing it here, which is what lets a run on
 * a terminal be one line per stage: a scaffolder printing its own progress and a spinner cannot share a line. Its
 * stdin is closed rather than inherited, so nothing downstream can stop to ask a question nobody is watching for.
 */
export const runSpawn = async (
  command: string,
  args: string[],
  cwd: string,
  output: RunOutput = 'inherit',
): Promise<void> => {
  await new Promise<void>((settle, fail) => {
    const captured: string[] = [];
    const child = spawn(command, args, {
      cwd,
      stdio: output === 'capture' ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: false,
      // Angular's CLI otherwise prompts for analytics with no flag to decline.
      env: {
        ...env,
        NG_CLI_ANALYTICS: 'false',
      },
    });

    const keep = (chunk: Buffer): void => {
      captured.push(chunk.toString('utf8'));
    };

    child.stdout?.on('data', keep);
    child.stderr?.on('data', keep);

    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) {
        settle();
        return;
      }

      // What it printed is the whole of why it failed, and on a terminal nobody has seen it yet.
      const said = captured.length === 0 ? '' : `\n${captured.join('')}`;

      fail(new Error(`${command} ${args.join(' ')} exited with ${String(code)}${said}`));
    });
  });
};
