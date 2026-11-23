import {
  ROUTER_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
} from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const VITE_REACT_SUBJECTS: readonly Subject[] = [
  {
    shell: 'vite-react',
    path: 'src/components/features/app-header/AppHeader.tsx',
    base: 'vite-react/app-header/AppHeader.tsx',
    parameters: {
      './router': { question: 'router', default: 'react-routers' },
      './styling': { question: 'styling' },
    },
    groups: ROUTER_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/pages/home/HomePage.tsx',
    base: 'vite-react/home-page/HomePage.tsx',
    parameters: {
      './store': { question: 'store', default: 'react-state' },
      './styling': { question: 'styling' },
    },
    groups: ROUTER_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/pages/home/HomePage.styles.ts',
    where: { styling: 'stylex' },
    base: 'shared/home-stylex/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'libraries': 'store.counter.ts', 'react-state': 'store.ts' },
      },
    },
    groups: ROUTER_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/App.test.tsx',
    base: 'vite-react/app/App.test.tsx',
    parameters: { './router': { question: 'router' } },
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/components/features/app-header/AppHeader.test.tsx',
    base: 'vite-react/app-header-test/AppHeader.test.tsx',
    parameters: { './router': { question: 'router' } },
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/components/features/route-error/RouteError.test.tsx',
    base: 'vite-react/route-error/RouteError.test.tsx',
    parameters: { './router': { question: 'router' } },
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'vite-react',
    path: 'src/root.tsx',
    base: 'vite-react/root/root.tsx',
    parameters: { './styling': { question: 'styling', default: 'classes' } },
    groups: ROUTER_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
