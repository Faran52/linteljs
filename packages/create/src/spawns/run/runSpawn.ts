import { spawn } from 'node:child_process';

import { repositoryFreeEnv } from '../utils/envUtils';

import type { RunOutput } from '@config/types';

// Async: a `spawnSync` install blocks the event loop. Stdin closed, so nothing stops to ask unseen.
export const runSpawn = async (
  command: string,
  args: string[],
  cwd: string,
  output?: RunOutput,
): Promise<void> => {
  await new Promise<void>((settle, fail) => {
    const captured: string[] = [];
    const child = spawn(command, args, {
      cwd,
      stdio: output === 'capture'
        ? [
            'ignore',
            'pipe',
            'pipe',
          ]
        : 'inherit',
      shell: false,
      // Angular's CLI otherwise prompts for analytics; pnpm and Yarn 4 under CI refuse a lockfile the install changes.
      // Without the repository variables, husky's `prepare` sets its hooks path on this project, not the caller's.
      env: {
        ...repositoryFreeEnv(),
        NG_CLI_ANALYTICS: 'false',
        pnpm_config_frozen_lockfile: 'false',
        YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
      },
    });

    const keep = (chunk: Buffer): void => {
      captured.push(chunk.toString('utf8'));
    };

    child.stdout?.on('data', keep);
    child.stderr?.on('data', keep);

    child.on('error', fail);

    child
      .on('close', (code) => {
        if (code === 0) {
          settle();
          return;
        }

        // On a terminal nobody has seen what it printed yet.
        const said = captured.length === 0 ? '' : `\n${captured.join('')}`;

        fail(new Error(`${command} ${args.join(' ')} exited with ${String(code)}${said}`));
      });
  });
};
