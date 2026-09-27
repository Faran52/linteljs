import { spawnSync } from 'node:child_process';

import { resolvedBinary } from '../utils/binaryUtils';

// Asked only under bun, whose `process.versions.node` is the Node it bundles.
export const nodeSpawn = (): string | undefined => {
  const binary = resolvedBinary('node');

  if (binary === undefined) {
    return undefined;
  }

  const result = spawnSync(binary, ['--version'], { encoding: 'utf8' });

  return result.status === 0
    ? result.stdout
        .trim()
        .replace('v', '')
    : undefined;
};
