import { spawn } from 'node:child_process';
import { join } from 'node:path';

// The binary is there and did not run: a broken shim, or no permission to execute it. Nothing ran, so nothing printed.
interface NotRun {
  failed: true;
}

interface Ran {
  failed: false;
  status: number | null;
  stdout: string;
}

export type LocalBinaryRun = NotRun | Ran;

/**
 * A binary the project installed into its own `node_modules`. An absent one answers `null` rather than a failure,
 * because before `install` has run there is nothing there to fix and that is not an error: `spawn` reports it as
 * ENOENT, so no separate presence check is needed.
 *
 * Asynchronous, like every other spawn in this ring: `spawnSync` would hold the event loop for as long as
 * `eslint --fix` takes and freeze the terminal's spinner.
 */
export const localBinarySpawn = async (cwd: string, name: string, args: string[]): Promise<LocalBinaryRun | null> => {
  return await new Promise<LocalBinaryRun | null>((settle) => {
    const child = spawn(join(cwd, 'node_modules', '.bin', name), args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const out: string[] = [];

    child.stdout
      .on('data', (chunk: Buffer) => {
        out.push(chunk.toString('utf8'));
      });

    // A spawn that never started emits `error` and no `close`, so this settles rather than waiting for one. ENOENT is
    // the binary being absent, which is an answer; anything else is a binary that is there and would not run.
    child
      .on('error', (error) => {
        settle('code' in error && error.code === 'ENOENT' ? null : { failed: true });
      });

    child
      .on('close', (status) => {
        settle({
          failed: false,
          status,
          stdout: out.join(''),
        });
      });
  });
};
