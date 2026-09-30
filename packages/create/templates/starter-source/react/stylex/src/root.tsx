import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { AppHeader } from './components/features/app-header/AppHeader';
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
        <Meta />
        <Links />
        {/* StyleX injects its dev CSS into `index.html`, which framework mode does not have. */}
        {import.meta.env.DEV
          ? (
              <>
                <script type="module" src="/@id/virtual:stylex:runtime" />
                <link rel="stylesheet" href="/virtual:stylex.css" />
              </>
            )
          : null}
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

export default Root;
