import { type FC, useState } from 'react';

import { NAME } from '@config/linteljs';

import { AppHeader } from '@features/app-header/AppHeader';
import { ErrorBoundary } from '@features/error-boundary/ErrorBoundary';

import { ROUTES } from '@router/router';

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
