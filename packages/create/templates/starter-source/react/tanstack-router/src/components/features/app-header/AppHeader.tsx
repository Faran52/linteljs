import { Link } from '@tanstack/react-router';

import { ROUTES } from '../../../pages/routes';

import { styles } from './styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

/*
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
            <Link
              key={id}
              to={path}
              {...styles.tab(false)}
              activeProps={{
                'aria-current': 'page',
                ...styles.tab(true),
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
