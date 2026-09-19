import {
  COMPONENT,
  componentNaming,
  DECLARATION_KEY,
  FOLDER,
  FOLDER_ROUTED,
  scriptKeys,
  sfcNaming,
} from './utils/namingUtils';

import type { TargetId } from '../answers/target/target';
import type { NamingMap } from '../config/types';

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
  // `ng generate`'s own spelling; `ignoreMiddleExtensions` already reduces `app.spec.ts` to `app`. The declaration
  // key is not optional here either: `customTypes.d.ts` ships with `typeSafety: relaxed` and is not kebab.
  'angular': {
    'src/**/*.ts': 'KEBAB_CASE',
    ...DECLARATION_KEY,
  },
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
