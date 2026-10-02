import { spawn } from 'node:child_process';
import { join } from 'node:path';

interface NotRun {
  failed: true;
}

interface Ran {
  failed: false;
  status: number | null;
  stdout: string;
}

export type LocalBinaryRun = NotRun | Ran;

// Absent answers `null`: before `install` there is nothing to fix. Async, so the spinner keeps turning.
export const localBinarySpawn = async (cwd: string, name: string, args: string[]): Promise<LocalBinaryRun | null> => {
  return await new Promise<LocalBinaryRun | null>((settle) => {
    const child = spawn(join(cwd, 'node_modules', '.bin', name), args, {
      cwd,
      stdio: [
        'ignore',
        'pipe',
        'pipe',
      ],
    });

    const out: string[] = [];

    child.stdout
      .on('data', (chunk: Buffer) => {
        out.push(chunk.toString('utf8'));
      });

    // A spawn that never started emits `error` and no `close`.
    child
      .on('error', (error) => {
        const run: LocalBinaryRun | null = 'code' in error && error.code === 'ENOENT' ? null : { failed: true };

        settle(run);
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
