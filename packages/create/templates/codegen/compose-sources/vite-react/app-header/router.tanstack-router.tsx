import { Link } from '@tanstack/react-router';

import { sx } from './styling';

import type { NavItemProps } from './ports';
import type { FC } from 'react';

export const headerComment = 'An element that navigates is an anchor; faking one with a button breaks middle-click.';

export type RouterProps = Record<never, never>;

export const useNavSetup = () => {
  // Spread, since an interface does not meet the data-* index signature `activeProps` takes.
  const activeProps = { ...sx.tab(true) };

  return { activeProps };
};

export const NavItem: FC<NavItemProps<ReturnType<typeof useNavSetup>>> = ({ path, setup, children }) => {
  return (
    <Link
      to={path}
      {...sx.tab(false)}
      activeProps={setup.activeProps}
    >
      {children}
    </Link>
  );
};
