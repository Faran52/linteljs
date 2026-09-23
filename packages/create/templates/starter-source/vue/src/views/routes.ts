import AboutView from './AboutView.vue';
import HomeView from './HomeView.vue';
import VersionView from './VersionView.vue';

import type { Component } from 'vue';

export interface Route {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly component: Component;
}

// Every page this project has, once: the router registers it and the header links to it.
/*
 * A non-empty tuple, not an array: this project always has a home page, and typed as an array the first entry is
 * possibly-undefined and every reader carries a fallback for a case it cannot reach.
 */
export const ROUTES: readonly [Route, ...Route[]] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    component: HomeView,
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    component: AboutView,
  },
  {
    id: 'version',
    label: 'Version',
    path: '/version',
    component: VersionView,
  },
];
