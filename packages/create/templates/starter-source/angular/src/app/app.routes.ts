import { About } from './about/about';
import { Home } from './home/home';
import { Version } from './version/version';

import type { Routes } from '@angular/router';

// The header reads `PAGES`, which carries the same paths and the labels a route has no room for.
export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'contact',
    // Lazy: the form library and the rules (Zod, when chosen) stay out of the first load.
    loadComponent: async () => {
      const { Contact } = await import('./contact/contact');

      return Contact;
    },
  },
  {
    path: 'about',
    component: About,
  },
  {
    path: 'version',
    component: Version,
  },
];
