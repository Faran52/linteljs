import { For, type JSX } from 'solid-js';

import { ROUTES } from '@pages/routes';

import { styles } from './appHeaderStyles';

export interface AppHeaderProps {
  readonly name: string;
  readonly current: string;
  readonly onNavigate: (page: string) => void;
}

// Controls rather than links: they swap a view rather than navigating.
export const AppHeader = (props: AppHeaderProps): JSX.Element => {
  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>LintelJS Starter</p>
      <p {...styles.brand}>{props.name}</p>
      <nav {...styles.tabs} aria-label="Main">
        <For each={ROUTES}>
          {(route) => {
            return (
              <button
                {...styles.tab(route.id === props.current)}
                type="button"
                aria-current={route.id === props.current ? 'page' : undefined}
                onClick={() => {
                  props.onNavigate(route.id);
                }}
              >
                {route.label}
              </button>
            );
          }}
        </For>
      </nav>
    </header>
  );
};
