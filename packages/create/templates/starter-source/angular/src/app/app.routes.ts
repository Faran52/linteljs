import { About } from './about/about';
import { Contact } from './contact/contact';
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
    component: Contact,
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
