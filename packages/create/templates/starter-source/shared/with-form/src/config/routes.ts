export interface Page {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

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
