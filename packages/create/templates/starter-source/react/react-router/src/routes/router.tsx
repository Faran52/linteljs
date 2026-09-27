import { createBrowserRouter } from 'react-router';

import { AppHeader } from '../components/features/app-header/AppHeader';
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

export const router = createBrowserRouter(ROUTES
  .map(({ path, element }) => {
    return {
      path,
      element: <Shell>{element}</Shell>,
    };
  }));
