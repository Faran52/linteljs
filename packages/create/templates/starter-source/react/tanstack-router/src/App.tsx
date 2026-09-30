import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

import { AppHeader } from './components/features/app-header/AppHeader';
import { NAME } from './config/linteljs';
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
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
