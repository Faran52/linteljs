import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { AppHeader } from './components/features/app-header/AppHeader';
import { RouteError } from './components/features/route-error/RouteError';
import { NAME } from './config/linteljs';
import { DataProvider } from './lib/providers/data/DataProvider';
import { StoreProvider } from './lib/providers/store/StoreProvider';

import type { ReactNode } from 'react';

import './index.css';

interface LayoutProps {
  readonly children: ReactNode;
}

export const Layout = ({ children }: LayoutProps): ReactNode => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
        <title>{NAME}</title>
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

// A path nothing matches, a refused loader and a crash all land here, inside the layout.
export const ErrorBoundary = RouteError;

export default Root;
