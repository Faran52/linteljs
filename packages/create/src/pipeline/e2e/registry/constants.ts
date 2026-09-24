import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Walked up to `pnpm-workspace.yaml` rather than counted in `..`. A fixed depth was silently wrong the moment this
 * file moved one directory, and nothing caught it: the end-to-end suite is the only thing that reads `ROOT` and it
 * is excluded from `pnpm check`, so the next gate to run it was CI.
 */
const workspaceRootFrom = (from: string): string => {
  let directory = from;

  while (!existsSync(join(directory, 'pnpm-workspace.yaml'))) {
    const parent = dirname(directory);

    if (parent === directory) {
      throw new Error(`No pnpm-workspace.yaml above ${from}`);
    }

    directory = parent;
  }

  return directory;
};

export const ROOT = workspaceRootFrom(import.meta.dirname);

/**
 * One registry for a run, on a fixed port. Every job in `e2e.yml` is one package manager on its own machine, so two
 * registries never want the same machine at once. Fixed rather
 * than chosen freshly because Yarn caches package metadata globally, tarball URLs included, and Verdaccio answers its
 * conditional request with 304 whenever upstream is unchanged: a port that moved between runs is a dead tarball host.
 */
export const PORT = 48730;

// Wiped at the start of every run: anything recording which versions exist rather than what bytes they hold.
export const RUN_DIR = join(ROOT, '.e2e');

// Never wiped, and outside `RUN_DIR`. A package manager's cache records the registry a tarball came from, which the
// fixed port above keeps valid between runs, so every download survives to the next one.
export const CACHE_DIR = join(ROOT, '.e2e-cache');

// What the registry proxies everything outside `@linteljs/*` to, unless `E2E_UPSTREAM` names another.
export const UPSTREAM = 'https://registry.npmjs.org/';

export const WORKSPACE_MANIFESTS = ['create', 'eslint-config', 'eslint-plugin'].map((name) => {
  return join(ROOT, 'packages', name, 'package.json');
});
