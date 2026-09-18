import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export interface LocalBinaryRun {
  status: number | null;
  stdout: string;
  // The binary is there and did not run: a broken shim, or no permission to execute it.
  failed: boolean;
}

/**
 * A binary the project installed into its own `node_modules`. An absent one answers `null` rather than a failure,
 * because before `install` has run there is nothing there to fix and that is not an error. `spawnSync` reports it
 * as ENOENT, so no separate presence check is needed.
 */
export const runLocalBinary = (cwd: string, name: string, args: string[]): LocalBinaryRun | null => {
  const result = spawnSync(join(cwd, 'node_modules', '.bin', name), args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error !== undefined && 'code' in result.error && result.error.code === 'ENOENT') {
    return null;
  }

  return {
    status: result.status,
    stdout: result.stdout,
    failed: result.error !== undefined,
  };
};
