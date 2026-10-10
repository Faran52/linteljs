export const PLUGIN_DIR = 'packages/create/templates/project/plugins/linteljs';

// The Node hook suites, which Vitest runs; the band's own suite is a `.tsx`.
export const NODE_SUITE = /\.test\.ts$/u;

// The catalog's pinned engine, not whichever `claude` is first on PATH.
export const CLAUDE = 'node_modules/.bin/claude';
