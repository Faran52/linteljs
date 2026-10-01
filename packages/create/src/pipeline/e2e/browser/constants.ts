// The servers that take their port as `--port` rather than from `PORT`.
export const PORT_FLAGGED = new Set([
  'vite',
  'astro',
  'ng',
]);

// `ng serve` compiles before it answers.
export const SERVER_TIMEOUT = 120_000;

export const POLL_INTERVAL = 500;

// A client-rendered starter mounts its heading after `load`.
export const HEADING_TIMEOUT = 10_000;

// The system Chrome: a CDN browser download can be blocked.
export const BROWSER_OPTIONS = { channel: 'chrome' };

export const STARTER_LINKS = 'a[href^="/"]';

export const ROUTE_SUFFIX = /[?#]/;
