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

export const OK_STATUS = 200;

export const STARTER_LINKS = 'a[href^="/"]';

export const ROUTE_SUFFIX = /[?#]/;

// The header tabs of a starter without a router.
export const VIEW_CONTROLS = 'nav[aria-label="Main"] button';

// The targets whose server renders every request, so a stored language reaches the first byte.
export const SERVER_RENDERED: ReadonlySet<string> = new Set([
  'next',
  'nuxt',
  'svelte',
]);

export const LANGUAGE_PICKER = 'select';

export const OTHER_LANGUAGE = 'option:not([value="en"])';

export const HTML_LANG = /<html[^>]*\slang="(?<lang>[^"]*)"/u;
