import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

import { NAME } from '@config/linteljs';
import { STATUSES } from '@config/statuses';

import { AppHeader } from '@features/app-header/AppHeader';
import { RouteError } from '@features/route-error/RouteError';
import { StatusPage } from '@features/status-page/StatusPage';

import { ROUTES } from '@pages/routes';

import type { FC } from 'react';

const rootRoute = createRootRoute({
  component: () => {
    return (
      <>
        <AppHeader name={NAME} />
        <Outlet />
      </>
    );
  },
});

const pageRoutes = ROUTES
  .map(({ path, element }) => {
    return createRoute({
      getParentRoute: () => {
        return rootRoute;
      },
      path,
      component: () => {
        return element;
      },
    });
  });

const router = createRouter({
  routeTree: rootRoute.addChildren(pageRoutes),
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: () => {
    return <StatusPage {...STATUSES.notFound} />;
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
