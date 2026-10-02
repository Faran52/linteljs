import { homedir } from 'node:os';
import { join } from 'node:path';

export const CACHE_ROOT = join(homedir(), '.cache', 'linteljs', 'typed');

export const TARBALLS = join(CACHE_ROOT, 'tarballs');

export const PACKING = join(CACHE_ROOT, 'packing');

export const PROJECTS = join(CACHE_ROOT, 'projects');

export const STAMPS = join(CACHE_ROOT, 'stamps');

// The label is too long to sit in the line the generated config writes it on.
export const PROJECT_NAME = 'starter';

export const CONFIG_PACKAGE = 'eslint-config';

export const PLUGIN_PACKAGE = 'eslint-plugin';

// Regenerating keeps these, so an unchanged lockfile installs as a no-op.
export const KEPT = new Set([
  'node_modules',
  'pnpm-lock.yaml',
]);

// Install and git write these, not the generator.
export const UNSTAMPED = new Set([...KEPT, '.git']);

export const CONFIG_SPEC = /"@linteljs\/eslint-config": "[^"]+"/u;

// A line start, so an `overrides` nested under another key is not it.
export const OVERRIDES_KEY = '\noverrides:\n';

export const NOT_SLUG = /[^a-z0-9]+/gu;

export const MAX_BUFFER = 256 * 1024 * 1024;

export const HASH_PREFIX_LENGTH = 16;
