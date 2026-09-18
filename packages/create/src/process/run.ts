import { spawn } from 'node:child_process';
import { env } from 'node:process';

// Asynchronous on purpose: a `spawnSync` install blocks the event loop, which serialises a whole
// end-to-end file however wide its concurrency is set.
export const run = async (command: string, args: string[], cwd: string): Promise<void> => {
  await new Promise<void>((settle, fail) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      // Angular's CLI otherwise prompts for analytics with no flag to decline.
      env: {
        ...env,
        NG_CLI_ANALYTICS: 'false',
      },
    });

    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) {
        settle();
        return;
      }

      fail(new Error(`${command} ${args.join(' ')} exited with ${String(code)}`));
    });
  });
};
