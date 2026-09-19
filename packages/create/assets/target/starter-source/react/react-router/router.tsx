import { createBrowserRouter } from 'react-router';

import App from '../App';

// The route table. A page lives in `src/pages/<kebab>/{Name}Page.tsx` and is named here once.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
  },
]);
