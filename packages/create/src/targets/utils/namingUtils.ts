import { COMPONENT, DECLARATION_KEY } from '../constants';

import type { NamingMap } from '#config/types';

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
