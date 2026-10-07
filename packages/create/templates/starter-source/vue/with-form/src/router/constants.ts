import AboutView from '@views/about/AboutView.vue';
import ContactView from '@views/contact/ContactView.vue';
import HomeView from '@views/home/HomeView.vue';
import VersionView from '@views/version/VersionView.vue';

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
    id: 'contact',
    label: 'Contact',
    path: '/contact',
    component: ContactView,
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
