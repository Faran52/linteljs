import { createBrowserRouter } from 'react-router';

import { AppHeader } from '../components/features/app-header/AppHeader';
import { NAME } from '../config/linteljs';
import { ROUTES } from '../pages/routes';

import type { FC, ReactNode } from 'react';

interface ShellProps {
  readonly children: ReactNode;
}

// The header is outside the route, so it renders once and every route fills what sits under it.
const Shell: FC<ShellProps> = ({ children }) => {
  return (
    <>
      <AppHeader name={NAME} />
      {children}
    </>
  );
};

// One route per page, read off the one list the header reads. A page is added there and appears in both.
export const router = createBrowserRouter(ROUTES
  .map(({ path, element }) => {
    return {
      path,
      element: <Shell>{element}</Shell>,
    };
  }));
