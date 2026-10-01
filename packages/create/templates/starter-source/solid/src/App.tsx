import {
  createSignal,
  type JSX,
  Show,
} from 'solid-js';

import { AppHeader } from './components/features/app-header/AppHeader';
import { ErrorBoundary } from './components/features/error-boundary/ErrorBoundary';
import { NAME } from './config/linteljs';
import { ROUTES } from './pages/routes';

export interface AppProps {
  readonly initialPage?: string;
}

// `props` is read rather than destructured: destructuring reads `initialPage` once.
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
          return <ErrorBoundary>{route.element()}</ErrorBoundary>;
        }}
      </Show>
    </>
  );
};
