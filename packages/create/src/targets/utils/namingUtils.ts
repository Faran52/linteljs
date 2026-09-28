import {
  COMPONENT,
  DECLARATION_KEY,
  UTILS_KEY,
} from '../constants';

import type { NamingMap } from '@config/types';

// `check-file` applies every matching key; `src/!(app)/**/*` alone cannot reach a file directly in `src/`.
export const scriptKeys = (routeDirectory?: string): NamingMap => {
  if (routeDirectory === undefined) {
    return {
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      ...UTILS_KEY,
    };
  }

  return {
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    [`src/!(${routeDirectory})/**/!(*.d|*.test|*.spec).ts`]: 'CAMEL_CASE',
    ...UTILS_KEY,
  };
};

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
