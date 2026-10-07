import { NAME } from '@config/linteljs';

import { AboutPage } from '@pages/about/AboutPage';
import { ContactPage } from '@pages/contact/ContactPage';
import { HomePage } from '@pages/home/HomePage';
import { VersionPage } from '@pages/version/VersionPage';

import type { ReactNode } from 'react';

export interface Route {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly element: ReactNode;
}

// A non-empty tuple: typed as an array, the first entry is possibly-undefined for a case that cannot happen.
export const ROUTES: readonly [Route, ...Route[]] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    element: <HomePage name={NAME} />,
  },
  {
    id: 'contact',
    label: 'Contact',
    path: '/contact',
    element: <ContactPage />,
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
