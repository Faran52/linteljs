import type { PackageManager } from '@config/types';

// npm is also what a directory with none is taken for, so its two lockfiles have no row.
export const LOCKFILES: readonly (readonly [string, PackageManager])[] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
];
