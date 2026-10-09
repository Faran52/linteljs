import { expect, it } from 'vitest';

import { routesWriter } from './routesWriter';

it('imports each page and lists it in ROUTES', () => {
  const text = routesWriter({
    routes: [
      {
        path: '/',
        name: 'home',
        from: './pages/home',
      },
      {
        path: '/about-us',
        name: 'about-us',
        from: './pages/about-us',
      },
    ],
  });
  const expected = [
    "import Home from './pages/home';",
    "import AboutUs from './pages/about-us';",
    '',
    'export const ROUTES = [',
    "  { path: '/', name: 'home', component: Home },",
    "  { path: '/about-us', name: 'about-us', component: AboutUs },",
    '];',
    '',
  ].join('\n');

  expect(text).toBe(expected);
});

it.each([
  { routes: true },
  { routes: [{ path: '/' }] },
])('refuses routes of another shape', (share) => {
  const writing = (): void => {
    routesWriter(share);
  };

  expect(writing).toThrow('share key routes must be a list of { path, name, from }');
});
