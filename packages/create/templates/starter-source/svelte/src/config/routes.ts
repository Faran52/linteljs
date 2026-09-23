import { resolve } from '$app/paths';

/*
 * Every page the starter ships, in nav order. One list, so the header and the routes directory can never disagree
 * about which pages exist, and one place to add the next one.
 *
 * `resolve` is called here, per entry, rather than in the header that maps over them: its argument type is a
 * conditional on the route, so a union of routes matches no arm of it and one route at a time is the only shape
 * that compiles. What it does is apply `base`, so every link survives a project served from a sub-path.
 */
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
