import { spawnSync } from 'node:child_process';

import { MANAGER_BINARIES } from '@config/constants';

import type { PackageManager } from '@answers';

/**
 * What the manager answers when asked its own version, or `undefined` when it is not on PATH. Presence and version
 * are one question, so they are one spawn. Nothing is installed here: a manager below the floor is refused in
 * `terminal/`, because upgrading the global manager of someone running an older one on purpose is not this CLI's
 * to decide.
 */
export const packageManagerSpawn = (pm: PackageManager): string | undefined => {
  const result = spawnSync(MANAGER_BINARIES[pm], ['--version'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return result.status === 0 ? result.stdout.trim() : undefined;
};
