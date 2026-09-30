import { type FC, useState } from 'react';

import { AppHeader } from './components/features/app-header/AppHeader';
import { ErrorBoundary } from './components/features/error-boundary/ErrorBoundary';
import { NAME } from './config/linteljs';
import { ROUTES } from './pages/routes';

export interface AppProps {
  readonly initialPage?: string;
}

export const App: FC<AppProps> = ({ initialPage = ROUTES[0].id }) => {
  const [page, setPage] = useState(initialPage);
  const current = ROUTES
    .find((route) => {
      return route.id === page;
    });

  return (
    <>
      <AppHeader
        name={NAME}
        current={page}
        onNavigate={setPage}
      />
      {/* Keyed by page, so leaving a page that crashed clears the fallback. */}
      <ErrorBoundary key={page}>{current?.element}</ErrorBoundary>
    </>
  );
};
