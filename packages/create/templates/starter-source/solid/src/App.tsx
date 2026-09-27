import {
  createSignal,
  type JSX,
  Show,
} from 'solid-js';

import { AppHeader } from './components/features/app-header/AppHeader';
import { NAME } from './config/linteljs';
import { ROUTES } from './pages/routes';

export interface AppProps {
  readonly initialPage?: string;
}

/*
 * The header swaps this from a signal and the address bar never moves. Solid routes with `@solidjs/router` when a
 * project wants one; the pages are the same files either way.
 *
 * `props` is read rather than destructured: taking `initialPage` out of it once would read it once and never
 * again, which is the reactivity rule this target's own `solid-reactivity.md` carries.
 */
export const App = (props: AppProps): JSX.Element => {
  const [page, setPage] = createSignal(props.initialPage ?? ROUTES[0].id);
  const current = () => {
    return ROUTES
      .find((route) => {
        return route.id === page();
      });
  };

  return (
    <>
      <AppHeader
        name={NAME}
        current={page()}
        onNavigate={setPage}
      />
      {/* `keyed`: without it the block is built once and switching to another page re-renders the first one. */}
      <Show when={current()} keyed>
        {(route) => {
          return route.element();
        }}
      </Show>
    </>
  );
};
