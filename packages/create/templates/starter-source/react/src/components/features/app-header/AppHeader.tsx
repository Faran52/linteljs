import { ROUTES } from '@router/router';

import { styles } from './appHeaderStyles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
  readonly current: string;
  readonly onNavigate: (page: string) => void;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({
  name,
  current,
  onNavigate,
}) => {
  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>LintelJS Starter</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES
          .map(({ id, label }) => {
            return (
              <button
                key={id}
                type="button"
                aria-current={id === current ? 'page' : undefined}
                {...styles.tab(id === current)}
                onClick={() => {
                  onNavigate(id);
                }}
              >
                {label}
              </button>
            );
          })}
      </nav>
    </header>
  );
};
