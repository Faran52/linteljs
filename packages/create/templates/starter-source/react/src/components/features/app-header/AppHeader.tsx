import { ROUTES } from '../../../pages/routes';

import { styles } from './styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
  readonly current: string;
  readonly onNavigate: (page: string) => void;
}

/*
 * The one place the router answer is visible. Without a router these are buttons over local state and the address
 * bar never moves; with one they become links and it follows. An anchor that navigates is an anchor and a control
 * that swaps a view is a button, so faking the first with the second would break middle-click and lie about where
 * you are.
 */
export const AppHeader: FC<AppHeaderProps> = ({
  name,
  current,
  onNavigate,
}) => {
  return (
    <header {...styles.header}>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES.map(({ id, label }) => {
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
