import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from 'react-router';

import { NAME } from '@config/linteljs';

import { AppHeader } from '@features/app-header/AppHeader';
import { RouteError } from '@features/route-error/RouteError';

import { ROUTES } from '@router/router';

import type { FC, ReactNode } from 'react';

interface ShellProps {
  readonly children: ReactNode;
}

const Shell: FC<ShellProps> = ({ children }) => {
  return (
    <>
      <AppHeader name={NAME} />
      {children}
    </>
  );
};

// A path nothing matches lands on the root's error element, so the fallback keeps the header.
const router = createBrowserRouter([
  {
    element: <Shell><Outlet /></Shell>,
    errorElement: <Shell><RouteError /></Shell>,
    children: ROUTES
      .map(({ path, element }) => {
        const route = {
          path,
          element,
        };

        return route;
      }),
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
