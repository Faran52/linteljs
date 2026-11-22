import type { ImportGroups } from '../utils/composeUtils.ts';

const REACT_GROUP = [
  '^react$',
  '^react-dom$',
  '^react/',
  '^react-',
  '^@react',
];

const PACKAGES_GROUP = [String.raw`^@?\w`];

// What every `buildGroups` order ends with: parents, siblings, side effects, stylesheets.
const RELATIVE_GROUPS = [
  [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
  [String.raw`^\./`],
  [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
  [String.raw`^.+\.s?css$`],
];

// The base layer's groups for the vite-react starter, with the aliases it declares.
export const VITE_REACT_GROUPS: ImportGroups = [
  ['^node:'],
  REACT_GROUP,
  PACKAGES_GROUP,
  ['^@config(?:/|$)'],
  ['^@styles(?:/|$)'],
  ['^@store(?:/|$)'],
  ['^@ui(?:/|$)'],
  ['^@router(?:/|$)'],
  ...RELATIVE_GROUPS,
];

const NODE_GROUP = [
  '^node:',
  '^fs$',
  '^path$',
];

// The base layer's alias buckets, in the order `buildGroups` writes them.
const ALIAS_GROUPS = [
  [
    '^@config(?:/|$)',
    '^@typings(?:/|$)',
    '^@styles(?:/|$)',
  ],
  [
    '^@lib(?:/|$)',
    '^@store(?:/|$)',
    '^@services(?:/|$)',
    '^@providers(?:/|$)',
    '^@apis(?:/|$)',
    '^@utils(?:/|$)',
    '^@i18n(?:/|$)',
  ],
  [
    '^@hooks(?:/|$)',
    '^@composables(?:/|$)',
    '^@primitives(?:/|$)',
  ],
  [
    '^@ui(?:/|$)',
    '^@features(?:/|$)',
    '^@components(?:/|$)',
  ],
  ['^@mocks(?:/|$)'],
];

const VUE_GROUP = [
  '^vue$',
  '^vue-router$',
  '^pinia$',
  '^@vue/',
];

export const PLAIN_GROUPS: ImportGroups = [
  NODE_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const ANGULAR_GROUPS: ImportGroups = [
  NODE_GROUP,
  [
    '^@angular/',
    '^rxjs$',
    '^rxjs/',
  ],
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const NUXT_GROUPS: ImportGroups = [
  NODE_GROUP,
  [
    ...VUE_GROUP,
    '^nuxt$',
    '^nuxt/',
    '^#',
  ],
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const SVELTE_GROUPS: ImportGroups = [
  NODE_GROUP,
  [
    '^svelte$',
    '^svelte/',
    '^@sveltejs/',
    String.raw`^\$app/`,
    '^#lib(?:/|$)',
  ],
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const SOLID_GROUPS: ImportGroups = [
  NODE_GROUP,
  [
    '^solid-js$',
    '^solid-js/',
    '^@solidjs/',
  ],
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const VUE_GROUPS: ImportGroups = [
  NODE_GROUP,
  VUE_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

export const REACT_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

// Expo's `@/` alias, which the base layer does not know.
export const EXPO_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ['^@(?:/|$)'],
  ...RELATIVE_GROUPS,
];

// The vite-react starter's `@router` alias, which the base layer does not know.
export const ROUTER_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ['^@router(?:/|$)'],
  ...RELATIVE_GROUPS,
];

// The modules the vite-react options read styles and tokens from, and call the stylex sheets of.
export const STYLEX_PLAIN_DATA = ['./*.styles', '@styles/tokens.stylex'];

export const STYLEX_PURE_CALLS = ['./*.styles'];

export const CONTACT = 'src/lib/apis/contact/contactEndpoints.test.ts';

export const MOCKING_BASE = 'shared/contact-endpoints/contactEndpoints.test.ts';
