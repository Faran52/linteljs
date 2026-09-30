import { createBrowserRouter, Outlet } from 'react-router';

import { AppHeader } from '../components/features/app-header/AppHeader';
import { RouteError } from '../components/features/route-error/RouteError';
import { NAME } from '../config/linteljs';
import { ROUTES } from '../pages/routes';

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
export const router = createBrowserRouter([
  {
    element: <Shell><Outlet /></Shell>,
    errorElement: <Shell><RouteError /></Shell>,
    children: ROUTES
      .map(({ path, element }) => {
        return {
          path,
          element,
        };
      }),
  },
]);
