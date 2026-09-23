export interface Page {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

/*
 * Every page the starter ships, in nav order. One list, so the header and the routes directory can never disagree
 * about which pages exist, and one place to add the next one.
 *
 * Read by a target whose routes are its directory, where the route file names its own page and the nav has nothing
 * else to read. Everywhere else the route list carries the component too and lives beside the pages.
 */
export const PAGES: readonly Page[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
  },
  {
    id: 'contact',
    label: 'Contact',
    path: '/contact',
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
  },
  {
    id: 'version',
    label: 'Version',
    path: '/version',
  },
];
