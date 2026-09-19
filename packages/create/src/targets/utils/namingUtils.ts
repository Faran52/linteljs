import type { NamingMap } from '../../config/types';

// The glob vocabulary `check-file` is given, and the three shapes the tables in `naming.ts` compose out of it.
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
export const scriptKeys = (routeDirectory?: string): NamingMap => {
  if (routeDirectory === undefined) {
    return { 'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE' };
  }

  return {
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    [`src/!(${routeDirectory})/**/!(*.d|*.test|*.spec).ts`]: 'CAMEL_CASE',
  };
};

// Its own key: `src/**/*.ts` matches `vite-env.d.ts`, and two keys on one file must agree.
export const DECLARATION_KEY: NamingMap = { 'src/**/*.d.ts': DECLARATION };

// `.tsx` is a component wherever it sits.
export const componentNaming = (routeDirectory?: string): NamingMap => {
  return {
    'src/**/*.tsx': COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };
};

export const sfcNaming = (extension: 'vue' | 'svelte', routeDirectory?: string): NamingMap => {
  return {
    [`src/**/*.${extension}`]: COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };
};
