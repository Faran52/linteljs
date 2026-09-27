import type { PackageManager } from '@config/types';

/**
 * The lockfile a directory already has, for a run with no user agent: `--existing` and `sync` on a project
 * that carries one. In the order `package-manager-detector` checks them, which ends with npm's two; npm is also what
 * a directory with none is taken for, so those two could never change the answer and have no row.
 */
export const LOCKFILES: readonly (readonly [string, PackageManager])[] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
];
