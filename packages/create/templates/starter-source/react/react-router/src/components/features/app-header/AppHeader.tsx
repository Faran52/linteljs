import { NavLink } from 'react-router';

import { ROUTES } from '../../../pages/routes';

import { styles } from './styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

/*
 * `className` and `style` as functions, which is where React Router keeps the active state. A stylesheet says the
 * same thing with `.tab[aria-current="page"]`, but StyleX compiles to atomic classes and has no attribute
 * selector, so under that answer the condition has to be a value rather than a match. One markup either way.
 *
 * With a router the tabs are links and the address bar follows. An element that navigates is an anchor and one
 * that swaps a view is a button, so the no-router build renders buttons instead: faking the first with the second
 * breaks middle-click and lies about where you are.
 */
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  return (
    <header {...styles.header}>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES.map(({
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
