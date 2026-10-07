import { NAME } from '@config/linteljs';

import { AboutPage } from '@pages/about/AboutPage';
import { ContactPage } from '@pages/contact/ContactPage';
import { HomePage } from '@pages/home/HomePage';
import { VersionPage } from '@pages/version/VersionPage';

import type { JSX } from 'solid-js';

export interface Route {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  // A function rather than an element: Solid evaluates JSX eagerly, so a page would render before it is shown.
  readonly element: () => JSX.Element;
}

// A non-empty tuple: typed as an array, the first entry is possibly-undefined for a case that cannot happen.
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
    id: 'contact',
    label: 'Contact',
    path: '/contact',
    element: () => {
      return <ContactPage />;
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
