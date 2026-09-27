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

// A non-empty tuple: typed as an array, the first entry is possibly-undefined for a case that cannot happen.
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
