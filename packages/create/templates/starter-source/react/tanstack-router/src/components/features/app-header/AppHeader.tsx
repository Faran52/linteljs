import { Link } from '@tanstack/react-router';

import { ROUTES } from '@pages/routes';

import { styles } from './styles';

import type { AnchorHTMLAttributes, FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  const activeProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
    'aria-current': 'page',
    ...styles.tab(true),
  };

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
