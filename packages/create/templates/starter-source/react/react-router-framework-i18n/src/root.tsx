import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { NAME } from '@config/linteljs';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { initI18n } from '@i18n';

import { AppHeader } from '@features/app-header/AppHeader';
import { RouteError } from '@features/route-error/RouteError';

import './index.css';

interface LayoutProps {
  readonly children: ReactNode;
}

// The server cannot see the reader's languages, so both sides render English and the client detects after hydration.
initI18n({ lng: 'en' });

export const Layout = ({ children }: LayoutProps): ReactNode => {
  const { i18n } = useTranslation();

  // No language named, so the detector reads the stored choice, then the browser; it stores nothing.
  useEffect(() => {
    void i18n.changeLanguage();
  }, [i18n]);

  return (
    <html lang="en" dir="ltr">
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
