import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

import { AppHeader } from './components/features/app-header/AppHeader';
import { RouteError } from './components/features/route-error/RouteError';
import { StatusPage } from './components/features/status-page/StatusPage';
import { NAME } from './config/linteljs';
import { STATUSES } from './config/statuses';
import { ROUTES } from './pages/routes';

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

const router = createRouter({
  routeTree: rootRoute.addChildren(ROUTES
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
    })),
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
