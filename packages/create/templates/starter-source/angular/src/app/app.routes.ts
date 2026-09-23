import { About } from './about/about';
import { Home } from './home/home';
import { Version } from './version/version';

import type { Routes } from '@angular/router';

// One route per page, read by the router alone: the header reads `PAGES`, which carries the same paths and the
// labels a route has no room for.
export const routes: Routes = [
  {
    path: '',
    component: Home,
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
