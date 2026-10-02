import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Walked up rather than counted in `..`: only the e2e suite reads it, and `pnpm check` excludes that.
const workspaceRootFrom = (from: string): string => {
  let directory = from;
  let marker = join(directory, 'pnpm-workspace.yaml');

  while (!existsSync(marker)) {
    const parent = dirname(directory);

    if (parent === directory) {
      throw new Error(`No pnpm-workspace.yaml above ${from}`);
    }

    directory = parent;
    marker = join(directory, 'pnpm-workspace.yaml');
  }

  return directory;
};

export const ROOT = workspaceRootFrom(import.meta.dirname);

// Fixed: Yarn caches tarball URLs globally and Verdaccio answers 304, so a moved port is a dead tarball host.
export const PORT = 48730;

// Wiped at the start of every run: anything recording which versions exist rather than what bytes they hold.
export const RUN_DIR = join(ROOT, '.e2e');

// Never wiped: the fixed port keeps a cache's recorded registry valid between runs.
export const CACHE_DIR = join(ROOT, '.e2e-cache');

export const UPSTREAM = 'https://registry.npmjs.org/';

export const WORKSPACE_MANIFESTS = [
  'create',
  'eslint-config',
  'eslint-plugin',
]
  .map((name) => {
    return join(ROOT, 'packages', name, 'package.json');
  });
