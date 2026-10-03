import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '../../../..');

// Fixed: Yarn caches tarball URLs globally and Verdaccio answers 304, so a moved port is a dead tarball host.
export const PORT = 48730;

// Wiped at the start of every run: anything recording which versions exist rather than what bytes they hold.
export const RUN_DIR = join(ROOT, '.e2e');

// Never wiped: the fixed port keeps a cache's recorded registry valid between runs.
export const CACHE_DIR = join(ROOT, '.e2e-cache');

// Twenty seconds for verdaccio to answer its ping.
export const PING_ATTEMPTS = 100;

export const PING_INTERVAL = 200;

export const MS_PER_SECOND = 1000;

export const UPSTREAM = 'https://registry.npmjs.org/';

export const WORKSPACE_MANIFESTS = [
  join(ROOT, 'packages/create/package.json'),
  join(ROOT, 'packages/eslint-config/package.json'),
  join(ROOT, 'packages/eslint-plugin/package.json'),
];
