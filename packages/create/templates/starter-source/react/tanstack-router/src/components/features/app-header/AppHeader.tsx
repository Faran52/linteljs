import { Link } from '@tanstack/react-router';

import { ROUTES } from '@router/router';

import { styles } from './AppHeader.styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  // Spread, since an interface does not meet the data-* index signature `activeProps` takes.
  const activeProps = { ...styles.tab(true) };

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
