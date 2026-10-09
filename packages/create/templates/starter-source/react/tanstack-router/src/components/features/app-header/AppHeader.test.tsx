import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';

import { ROUTES } from '@router/router';

import { AppHeader } from './AppHeader';
import { styles } from './AppHeader.styles';

const renderAt = (path: string): void => {
  const rootRoute = createRootRoute({
    component: () => {
      return <AppHeader name="my-app" />;
    },
  });
  const pageRoutes = ROUTES
    .map((route) => {
      return createRoute({
        getParentRoute: () => {
          return rootRoute;
        },
        path: route.path,
      });
    });
  const router = createRouter({
    routeTree: rootRoute.addChildren(pageRoutes),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  render(<RouterProvider router={router} />);
};

describe('AppHeader', () => {
  it('names the project and links every page on the one route list', async () => {
    renderAt('/');

    const element = await screen.findByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();

    for (const { label, path } of ROUTES) {
      const attribute = screen.getByRole('link', { name: label }).getAttribute('href');
      expect(attribute).toBe(path);
    }
  });

  it('marks the page it is on and styles its tab apart', async () => {
    renderAt('/about');

    const link = await screen.findByRole('link', { name: 'About' });
    const home = screen.getByRole('link', { name: 'Home' });

    const attribute = link.getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = home.getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
    // StyleX types className as optional; join reads a missing one as empty.
    const missing = [styles.tab(true).className]
      .join(' ')
      .split(' ')
      .filter((name) => {
        return !link.classList.contains(name);
      });
    expect(missing).toEqual([]);
  });
});
