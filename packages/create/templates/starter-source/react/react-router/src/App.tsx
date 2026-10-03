import { RouterProvider } from 'react-router';

import { router } from '@routes/router';

import type { FC } from 'react';

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
