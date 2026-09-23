import { type FC, useState } from 'react';

import { AppHeader } from './components/features/app-header/AppHeader';
import { NAME } from './config/linteljs';
import { ROUTES } from './pages/routes';

export interface AppProps {
  readonly initialPage?: string;
}

/*
 * Without a router the header swaps this from local state and the address bar never moves. The pages are the same
 * files either way, so adding a router later writes a route table and changes the header, and moves nothing.
 */
export const App: FC<AppProps> = ({ initialPage = ROUTES[0].id }) => {
  const [page, setPage] = useState(initialPage);
  const current = ROUTES.find((route) => {
    return route.id === page;
  });

  return (
    <>
      <AppHeader
        name={NAME}
        current={page}
        onNavigate={setPage}
      />
      {current?.element}
    </>
  );
};
