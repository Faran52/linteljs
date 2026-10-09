import {
  COMPONENT,
  DECLARATION_KEY,
  UTILS_KEY,
} from '../constants';

import type { NamingMap } from '@config/types';

// Named for the component it styles, or for what it styles where no component owns it (`starter.styles.ts`).
const STYLES_KEY: NamingMap = { 'src/**/*.styles.ts': COMPONENT };

// `check-file` applies every matching key; `src/!(app)/**/*` alone cannot reach a file directly in `src/`.
export const scriptKeys = (routeDirectory?: string): NamingMap => {
  if (routeDirectory === undefined) {
    const naming: NamingMap = {
      'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
      ...STYLES_KEY,
      ...UTILS_KEY,
    };

    return naming;
  }

  const naming: NamingMap = {
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    [`src/!(${routeDirectory})/**/!(*.d|*.test|*.spec|*.styles).ts`]: 'CAMEL_CASE',
    ...STYLES_KEY,
    ...UTILS_KEY,
  };

  return naming;
};

export const componentNaming = (routeDirectory?: string): NamingMap => {
  const naming: NamingMap = {
    'src/**/*.tsx': COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };

  return naming;
};

export const sfcNaming = (extension: 'vue' | 'svelte', routeDirectory?: string): NamingMap => {
  const naming: NamingMap = {
    [`src/**/*.${extension}`]: COMPONENT,
    ...scriptKeys(routeDirectory),
    ...DECLARATION_KEY,
  };

  return naming;
};
