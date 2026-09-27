import { NavLink } from 'react-router';

import { ROUTES } from '../../../pages/routes';

import { styles } from './styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// StyleX has no attribute selector, so the active state is a value rather than a match.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>LintelJS Starter</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES
          .map(({
            id,
            label,
            path,
          }) => {
            return (
              <NavLink
                key={id}
                to={path}
                end
                className={({ isActive }) => {
                  return styles.tab(isActive).className;
                }}
                style={({ isActive }) => {
                  return styles.tab(isActive).style;
                }}
              >
                {label}
              </NavLink>
            );
          })}
      </nav>
    </header>
  );
};
