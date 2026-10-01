import { spawnSync } from 'node:child_process';

import type { PackageManager } from '@config/types';

// Nothing is installed here: upgrading someone's global manager is not this CLI's to decide.
export const packageManagerSpawn = (pm: PackageManager): string | undefined => {
  const result = spawnSync(pm, ['--version'], { encoding: 'utf8' });

  return result.status === 0 ? result.stdout.trim() : undefined;
};
