import {
  ROUTER_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
  VITE_REACT_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

const APP_HEADER = 'src/components/features/app-header/AppHeader.tsx';

const HOME_PAGE = 'src/pages/home/HomePage.tsx';

const HOME_STYLES = 'styling/stylex/src/pages/home/HomePage.styles.ts';

const LIBRARIES_STORE = 'vite-react/store/libraries';

const REACT_STATE_STORE = 'vite-react/data/redux-free/store/react-state';

const APP_HEADER_TEST = 'testing/vitest/src/components/features/app-header/AppHeader.test.tsx';

const ROUTE_ERROR_TEST = 'testing/vitest/src/components/features/route-error/RouteError.test.tsx';

export const VITE_REACT_SUBJECTS: readonly Subject[] = [
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
    base: 'shared/home-stylex/home.styles.ts',
    groups: VITE_REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.counter.ts' },
        shipped: `${LIBRARIES_STORE}/${HOME_STYLES}`,
      },
      {
        options: { './store': 'store.ts' },
        shipped: `${REACT_STATE_STORE}/${HOME_STYLES}`,
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
];
