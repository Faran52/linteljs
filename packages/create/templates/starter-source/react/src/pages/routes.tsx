import { NAME } from '../config/linteljs';

import { AboutPage } from './about/AboutPage';
import { HomePage } from './home/HomePage';
import { VersionPage } from './version/VersionPage';

import type { ReactNode } from 'react';

export interface Route {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly element: ReactNode;
}

/*
 * Every page this project has, once. The header reads the label and the path off it, the route table registers it,
 * and the no-router build switches on the id, so none of the three can disagree about which pages exist.
 */
/*
 * A non-empty tuple, not an array: this project always has a home page, and typed as an array the first entry is
 * possibly-undefined and every reader carries a fallback for a case it cannot reach.
 */
export const ROUTES: readonly [Route, ...Route[]] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    element: <HomePage name={NAME} />,
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    element: <AboutPage />,
  },
  {
    id: 'version',
    label: 'Version',
    path: '/version',
    element: <VersionPage />,
  },
];
