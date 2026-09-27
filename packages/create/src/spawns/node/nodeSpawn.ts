import { spawnSync } from 'node:child_process';

import { resolvedBinary } from '../utils/binaryUtils';

// The Node on PATH, `v` stripped, or `undefined` where there is none. Asked only under bun, which runs this CLI
// itself: `process.versions.node` there is the Node bun bundles, not the one a generated project will run on.
export const nodeSpawn = (): string | undefined => {
  const binary = resolvedBinary('node');

  if (binary === undefined) {
    return undefined;
  }

  const result = spawnSync(binary, ['--version'], { encoding: 'utf8' });

  // `node --version` prints `v` first and nowhere else.
  return result.status === 0
    ? result.stdout
        .trim()
        .replace('v', '')
    : undefined;
};
