import { Link } from '@tanstack/react-router';

import { ROUTES } from '@router/router';

import { styles } from './appHeaderStyles';

import type { AnchorHTMLAttributes, FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  const activeProps = {
    'aria-current': 'page',
    ...styles.tab(true),
  } satisfies AnchorHTMLAttributes<HTMLAnchorElement>;

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
              <Link
                key={id}
                to={path}
                {...styles.tab(false)}
                activeProps={activeProps}
              >
                {label}
              </Link>
            );
          })}
      </nav>
    </header>
  );
};
