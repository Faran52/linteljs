import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { AppHeader } from './components/features/app-header/AppHeader';
import { NAME } from './config/linteljs';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';

import type { ReactNode } from 'react';

import './index.css';

interface LayoutProps {
  readonly children: ReactNode;
}

/*
 * The document itself, which in framework mode is a module rather than an `index.html`. React Router renders this
 * on the server and hydrates it, so `Meta` and `Links` are where the head comes from and `Scripts` is what makes
 * the page interactive. The two providers wrap the outlet here for the same reason the no-router build wraps them
 * around `App`: an answer adds a provider rather than multiplying the entry.
 */
export const Layout = ({ children }: LayoutProps): ReactNode => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <StoreProvider>
          <DataProvider>
            <AppHeader name={NAME} />
            {children}
          </DataProvider>
        </StoreProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const Root = (): ReactNode => {
  return <Outlet />;
};

/*
 * No `ErrorBoundary` export, and React Router's own default stands in. Its props come from `./+types/root`, which
 * `react-router typegen` writes and nothing can read before the first build, and typing them by hand means a bare
 * `: unknown` on a thrown value that the mechanical floor refuses. A project adds one the moment it wants its own.
 */

export default Root;
