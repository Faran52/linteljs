import type { NamingMap, TargetId } from '../answers/answers';

const KEBAB = '+([a-z0-9])*(-+([a-z0-9]))';

// Everything except camelCase, so `[slug]`, `(tabs)`, `_layout` and `+page@(app)` pass while `useThing` does not.
export const COMPONENT = '!([a-z]*[A-Z]*)';

// Kebab-case or camelCase, so `vite-env.d.ts` and `assets.d.ts` both pass.
export const DECLARATION = `@(${KEBAB}|+([a-z])*([a-zA-Z0-9]))`;

// Plus `__tests__`, which every framework's tooling reserves.
export const FOLDER = `@(${KEBAB}|__tests__)`;

// Plus the segments a file-based router owns, granted to the React family, Solid and SvelteKit.
export const FOLDER_ROUTED = String.raw`@(${KEBAB}|__tests__|\[*\]|\(*\)|{*})`;

// `check-file` applies every matching key, so two conventions on one file satisfy neither. A route directory gets
// two keys because `src/!(app)/**/*` alone cannot reach a file directly in `src/`.
const scriptKeys = (routeDirectory?: string): NamingMap => {
  if (routeDirectory === undefined) {
    return { 'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE' };
  }

  return {
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    [`src/!(${routeDirectory})/**/!(*.d|*.test|*.spec).ts`]: 'CAMEL_CASE',
  };
};

// Its own key: `src/**/*.ts` matches `vite-env.d.ts`, and two keys on one file must agree.
const DECLARATION_KEY: NamingMap = { 'src/**/*.d.ts': DECLARATION };

// `.tsx` is a component wherever it sits.
const componentNaming = (routeDirectory?: string): NamingMap => {
  return {
    'src/**/*.tsx': COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };
};

const sfcNaming = (extension: 'vue' | 'svelte', routeDirectory?: string): NamingMap => {
  return {
    [`src/**/*.${extension}`]: COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };
};

// Keyed by target: the policy must be total and `webextension` has no framework.
export const NAMING: Record<TargetId, NamingMap> = {
  'react': componentNaming(),
  'next': componentNaming('app'),
  'vue': sfcNaming('vue'),
  'svelte': sfcNaming('svelte', 'routes'),
  'solid': componentNaming(),
  // `COMPONENT` admits both `Card.astro` and the lowercase `index.astro` a route has to be; `pages` is the route
  // directory.
  'astro': {
    'src/**/*.astro': COMPONENT,
    ...scriptKeys('pages'),
    ...DECLARATION_KEY,
  },
  // `ng generate`'s own spelling; `ignoreMiddleExtensions` already reduces `app.spec.ts` to `app`.
  'angular': { 'src/**/*.ts': 'KEBAB_CASE' },
  // A component is marked by directory rather than a `.tsx` extension.
  'webextension': {
    'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
    ...scriptKeys('components'),
    ...DECLARATION_KEY,
  },
  'react-native': componentNaming('app'),
};

export const FOLDER_NAMING: Record<TargetId, NamingMap> = {
  'react': { 'src/**/': FOLDER_ROUTED },
  'next': { 'src/**/': FOLDER_ROUTED },
  'vue': { 'src/**/': FOLDER },
  'svelte': { 'src/**/': FOLDER_ROUTED },
  'solid': { 'src/**/': FOLDER_ROUTED },
  'angular': { 'src/**/': FOLDER },
  // A dynamic route is `[slug].astro`, so a directory may be one too.
  'astro': { 'src/**/': FOLDER_ROUTED },
  'webextension': { 'src/**/': FOLDER },
  'react-native': { 'src/**/': FOLDER_ROUTED },
};
