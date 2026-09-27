import { resolve } from '$app/paths';

// `resolve` per entry: its argument type is conditional on the route, so a union matches no arm.
export const PAGES = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    href: resolve('/'),
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    href: resolve('/about'),
  },
  {
    id: 'version',
    label: 'Version',
    path: '/version',
    href: resolve('/version'),
  },
] as const;
