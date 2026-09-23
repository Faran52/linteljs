import { RouterProvider } from 'react-router';

import { router } from './routes/router';

import type { FC } from 'react';

/*
 * With a router this is the whole of the app: the route table owns which page renders, and the header's tabs are
 * real links, so the address bar follows. The pages themselves are the same files the no-router build uses.
 */
export const App: FC = () => {
  return <RouterProvider router={router} />;
};
