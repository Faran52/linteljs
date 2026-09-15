import { spawnSync } from 'node:child_process';

import type { PackageManager } from '../../model/answers/answers';

export const isCommandAvailable = (command: string): boolean => {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
};

const runOrThrow = (command: string, args: string[]): void => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stdout}${result.stderr}`);
  }
};

// Node 26 no longer bundles corepack, so a missing pnpm or yarn is installed through it; bun has no corepack shim.
export const ensurePackageManager = (pm: PackageManager, notice: (message: string) => void): void => {
  if (isCommandAvailable(pm)) {
    return;
  }

  if (pm === 'bun') {
    throw new Error('bun is not installed. Install it from https://bun.sh and run this again.');
  }

  notice(`Installing ${pm} via corepack...`);

  if (!isCommandAvailable('corepack')) {
    runOrThrow('npm', ['install', '-g', 'corepack']);
  }

  runOrThrow('corepack', ['enable']);
  runOrThrow('corepack', ['install', '-g', pm]);
};
