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

// The header is outside the routes, so it renders once and every route fills what sits under it.
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

/*
 * Built from the one route list rather than from a `routes/` directory and a generated tree. File-based routing is
 * this library's own default, and it is declined here for one reason: the tree would be a second list of the pages,
 * and the form answer adds a page, so the generated file would need a copy per combination of router and form.
 * Reading the array the header reads keeps that a sum, and a project that wants the generated tree adds the plugin.
 */
const router = createRouter({
  routeTree: rootRoute.addChildren(ROUTES.map(({ path, element }) => {
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

/*
 * With a router this is the whole of the app: the route table owns which page renders, and the header's tabs are
 * real links, so the address bar follows. The pages themselves are the same files the no-router build uses.
 */
export const App: FC = () => {
  return <RouterProvider router={router} />;
};
