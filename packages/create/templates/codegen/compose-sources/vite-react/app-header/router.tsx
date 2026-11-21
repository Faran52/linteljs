import { NavLink } from 'react-router';

import { sx } from './styling';

import type { NavItemProps } from './ports';
import type { FC } from 'react';

export type RouterProps = Record<never, never>;

export const useNavSetup = (): Record<never, never> => {
  return {};
};

export const NavItem: FC<NavItemProps<Record<never, never>>> = ({ path, children }) => {
  return (
    <NavLink
      to={path}
      end
      className={({ isActive }) => {
        return sx.tab(isActive).className;
      }}
      style={sx.inlineStyle ? ({ isActive }) => {
        return sx.tab(isActive).style;
      } : undefined}
    >
      {children}
    </NavLink>
  );
};
