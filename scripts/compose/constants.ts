import type { ImportGroups, Subject } from './utils/composeUtils.ts';

const TEMPLATES_DIR = 'packages/create/templates';

export const SOURCES_DIR = `${TEMPLATES_DIR}/codegen/compose-sources`;

export const SHELLS_DIR = `${TEMPLATES_DIR}/shells`;

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
const VITE_REACT_GROUPS: ImportGroups = [
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

const PLAIN_GROUPS: ImportGroups = [
  NODE_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

const ANGULAR_GROUPS: ImportGroups = [
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

const NUXT_GROUPS: ImportGroups = [
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

const SVELTE_GROUPS: ImportGroups = [
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

const SOLID_GROUPS: ImportGroups = [
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

const VUE_GROUPS: ImportGroups = [
  NODE_GROUP,
  VUE_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

const REACT_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ...RELATIVE_GROUPS,
];

// Expo's `@/` alias, which the base layer does not know.
const EXPO_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ['^@(?:/|$)'],
  ...RELATIVE_GROUPS,
];

// The vite-react starter's `@router` alias, which the base layer does not know.
const ROUTER_GROUPS: ImportGroups = [
  NODE_GROUP,
  REACT_GROUP,
  PACKAGES_GROUP,
  ...ALIAS_GROUPS,
  ['^@router(?:/|$)'],
  ...RELATIVE_GROUPS,
];

// The modules the vite-react options read styles and tokens from, and call the stylex sheets of.
const STYLEX_PLAIN_DATA = ['./*.styles', '@styles/tokens.stylex'];

const STYLEX_PURE_CALLS = ['./*.styles'];

const APP_HEADER = 'src/components/features/app-header/AppHeader.tsx';

const HOME_PAGE = 'src/pages/home/HomePage.tsx';

const HOME_STYLES = 'styling/stylex/src/pages/home/HomePage.styles.ts';

const LIBRARIES_STORE = 'vite-react/store/libraries';

const REACT_STATE_STORE = 'vite-react/data/redux-free/store/react-state';

const CONTACT = 'testing/vitest/src/lib/apis/contact/contactEndpoints.test.ts';

const APP_HEADER_TEST = 'testing/vitest/src/components/features/app-header/AppHeader.test.tsx';

const ROUTE_ERROR_TEST = 'testing/vitest/src/components/features/route-error/RouteError.test.tsx';

const BACKGROUND_TEST = 'surfaces/background/testing/vitest/src/background/onInstalled.test.ts';

const SVELTE_TEST = 'testing/vitest/src/routes/page.test.ts';

const SOLID = 'vite-solid/store';

const SOLID_TEST = 'testing/vitest/src/pages/home/HomePage.test.tsx';

const SOLID_PAGE = 'src/pages/home/HomePage.tsx';

const DEVTOOLS = 'surfaces/devtools-panel/src/devtools/devtools.ts';

const MOCKING_BASE = 'shared/contact-endpoints/contactEndpoints.test.ts';

const LOCAL_MOCKING = { './mocking': 'mocking.local.ts' };

const MSW_MOCKING = { './mocking': 'mocking.msw.ts' };

// Every composition the engine's suites hold, by the shipped file each one writes.
export const SUBJECTS: readonly Subject[] = [
  {
    base: 'vite-react/app-header/AppHeader.tsx',
    groups: VITE_REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './router': 'router.react-routers.tsx', './styling': 'styling.atomic.ts' },
        shipped: `vite-react/router/react-routers/styling/atomic/${APP_HEADER}`,
      },
      {
        options: { './router': 'router.react-routers.tsx', './styling': 'styling.css.ts' },
        shipped: `vite-react/router/react-routers/styling/css/${APP_HEADER}`,
      },
      {
        options: { './router': 'router.single-page.tsx', './styling': 'styling.atomic.ts' },
        shipped: `vite-react/router/single-page/styling/atomic/${APP_HEADER}`,
      },
      {
        options: { './router': 'router.single-page.tsx', './styling': 'styling.css.ts' },
        shipped: `vite-react/router/single-page/styling/css/${APP_HEADER}`,
      },
      {
        options: { './router': 'router.tanstack-router.tsx', './styling': 'styling.atomic.ts' },
        shipped: `vite-react/router/tanstack-router/styling/atomic/${APP_HEADER}`,
      },
      {
        options: { './router': 'router.tanstack-router.tsx', './styling': 'styling.css.ts' },
        shipped: `vite-react/router/tanstack-router/styling/css/${APP_HEADER}`,
      },
    ],
  },
  {
    base: 'vite-react/home-page/HomePage.tsx',
    groups: VITE_REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.tsx', './styling': 'styling.atomic.ts' },
        shipped: `${LIBRARIES_STORE}/styling/atomic/${HOME_PAGE}`,
      },
      {
        options: { './store': 'store.libraries.tsx', './styling': 'styling.css.ts' },
        shipped: `${LIBRARIES_STORE}/styling/css/${HOME_PAGE}`,
      },
      {
        options: { './store': 'store.react-state.tsx', './styling': 'styling.atomic.ts' },
        shipped: `${REACT_STATE_STORE}/styling/atomic/${HOME_PAGE}`,
      },
      {
        options: { './store': 'store.react-state.tsx', './styling': 'styling.css.ts' },
        shipped: `${REACT_STATE_STORE}/styling/css/${HOME_PAGE}`,
      },
    ],
  },
  {
    base: 'vite-react/home-page-styles/HomePage.styles.ts',
    groups: VITE_REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: `${LIBRARIES_STORE}/${HOME_STYLES}`,
      },
      {
        options: { './store': 'store.react-state.ts' },
        shipped: `${REACT_STATE_STORE}/${HOME_STYLES}`,
      },
    ],
  },
  {
    base: MOCKING_BASE,
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `astro/form/libraries/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `astro/form/libraries/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: MOCKING_BASE,
    groups: NUXT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `nuxt/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `nuxt/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: MOCKING_BASE,
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `sveltekit/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `sveltekit/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: MOCKING_BASE,
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `vite-solid/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `vite-solid/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: MOCKING_BASE,
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: LOCAL_MOCKING, shipped: `vite-vue/form/tanstack-form/mocking/local/${CONTACT}` },
      { options: MSW_MOCKING, shipped: `vite-vue/form/tanstack-form/mocking/msw/${CONTACT}` },
    ],
  },
  {
    base: 'shared/contact-endpoints/contact-endpoints.spec.ts',
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: LOCAL_MOCKING,
        shipped: 'angular-cli/mocking/local/testing/vitest/src/lib/apis/contact/contact-endpoints.spec.ts',
      },
      {
        options: MSW_MOCKING,
        shipped: 'angular-cli/mocking/msw/testing/vitest/src/lib/apis/contact/contact-endpoints.spec.ts',
      },
    ],
  },
  {
    base: 'angular-cli/home/home.spec.ts',
    groups: ANGULAR_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.ngrx-signals.ts' },
        shipped: 'angular-cli/store/ngrx-signals/testing/vitest/src/app/home/home.spec.ts',
      },
      {
        options: { './store': 'store.signals.ts' },
        shipped: 'angular-cli/store/signals/testing/vitest/src/app/home/home.spec.ts',
      },
    ],
  },
  {
    base: 'next/home-page/page.test.tsx',
    groups: REACT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.tsx' },
        shipped: 'next/store/libraries/testing/vitest/src/app/page.test.tsx',
      },
      {
        options: { './store': 'store.react-state.tsx' },
        shipped: 'next/data/redux-free/store/react-state/testing/vitest/src/app/page.test.tsx',
      },
    ],
  },
  {
    base: 'sveltekit/routes/page.test.ts',
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.runes.ts' }, shipped: `sveltekit/store/runes/${SVELTE_TEST}` },
      { options: { './store': 'store.tanstack-store.ts' }, shipped: `sveltekit/store/tanstack-store/${SVELTE_TEST}` },
    ],
  },
  {
    base: 'vite-solid/home-page/HomePage.test.tsx',
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.signals.tsx' }, shipped: `${SOLID}/signals/${SOLID_TEST}` },
      { options: { './store': 'store.tanstack-store.tsx' }, shipped: `${SOLID}/tanstack-store/${SOLID_TEST}` },
    ],
  },
  {
    base: 'vite-solid/home-page/HomePage.tsx',
    groups: SOLID_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './store': 'store.signals.tsx' }, shipped: `${SOLID}/signals/${SOLID_PAGE}` },
      { options: { './store': 'store.tanstack-store.tsx' }, shipped: `${SOLID}/tanstack-store/${SOLID_PAGE}` },
    ],
  },
  {
    base: 'vite-vue/home-view/HomeView.test.ts',
    groups: VUE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: 'vite-vue/store/libraries/testing/vitest/src/views/home/HomeView.test.ts',
      },
      {
        options: { './store': 'store.vue-reactivity.ts' },
        shipped: 'vite-vue/store/vue-reactivity/testing/vitest/src/views/home/HomeView.test.ts',
      },
    ],
  },
  {
    base: 'expo/app-layout/app-layout.test.tsx',
    groups: EXPO_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './styling': 'styling.css.ts' },
        shipped: 'expo/testing/jest/styling/css/src/app-layout.test.tsx',
      },
      {
        options: { './styling': 'styling.tailwind.ts' },
        shipped: 'expo/testing/jest/styling/tailwind/src/app-layout.test.tsx',
      },
    ],
  },
  {
    base: 'vite-react/app/App.test.tsx',
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './router': 'router.single-page.tsx' },
        shipped: 'vite-react/router/single-page/testing/vitest/src/App.test.tsx',
      },
      {
        options: { './router': 'router.libraries.tsx' },
        shipped: 'vite-react/router/libraries/testing/vitest/src/App.test.tsx',
      },
    ],
  },
  {
    base: 'vite-react/app-header-test/AppHeader.test.tsx',
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './router': 'router.react-routers.tsx' },
        shipped: `vite-react/router/react-routers/${APP_HEADER_TEST}`,
      },
      {
        options: { './router': 'router.single-page.tsx' },
        shipped: `vite-react/router/single-page/${APP_HEADER_TEST}`,
      },
      {
        options: { './router': 'router.tanstack-router.tsx' },
        shipped: `vite-react/router/tanstack-router/${APP_HEADER_TEST}`,
      },
    ],
  },
  {
    base: 'vite-react/route-error/RouteError.test.tsx',
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './router': 'router.react-routers.tsx' },
        shipped: `vite-react/router/react-routers/${ROUTE_ERROR_TEST}`,
      },
      {
        options: { './router': 'router.tanstack-router.tsx' },
        shipped: `vite-react/router/tanstack-router/${ROUTE_ERROR_TEST}`,
      },
    ],
  },
  {
    base: 'wxt/background/onInstalled.test.ts',
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './browser': 'browser.chrome.ts' }, shipped: `wxt/browser/chrome/${BACKGROUND_TEST}` },
      { options: { './browser': 'browser.firefox.ts' }, shipped: `wxt/browser/firefox/${BACKGROUND_TEST}` },
    ],
  },
  {
    base: 'wxt/devtools/devtools.ts',
    groups: PLAIN_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      { options: { './browser': 'browser.chrome.ts' }, shipped: `wxt/browser/chrome/${DEVTOOLS}` },
      { options: { './browser': 'browser.firefox.ts' }, shipped: `wxt/browser/firefox/${DEVTOOLS}` },
    ],
  },
];
