import { NAME } from '../config/linteljs';

import { AboutPage } from './about/AboutPage';
import { HomePage } from './home/HomePage';
import { VersionPage } from './version/VersionPage';

import type { JSX } from 'solid-js';

export interface Route {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  // A function rather than an element: Solid evaluates JSX eagerly, so a page would render before it is shown.
  readonly element: () => JSX.Element;
}

/*
 * Every page this project has, once. The header reads the label and the path off it and the switch reads the id,
 * so neither can disagree about which pages exist.
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
    element: () => {
      return <HomePage name={NAME} />;
    },
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    element: () => {
      return <AboutPage />;
    },
  },
  {
    id: 'version',
    label: 'Version',
    path: '/version',
    element: () => {
      return <VersionPage />;
    },
  },
];
