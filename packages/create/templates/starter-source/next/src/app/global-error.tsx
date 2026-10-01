'use client';

import { NAME } from '@config/linteljs';
import { STATUSES } from '@config/statuses';

import { AppHeader } from '@features/app-header/AppHeader';
import { StatusPage } from '@features/status-page/StatusPage';

import type { ReactNode } from 'react';

import './globals.css';

interface GlobalErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

// A crash in the layout itself: this replaces the whole document, so it carries its own.
const GlobalError = ({ reset }: GlobalErrorProps): ReactNode => {
  return (
    <html lang="en">
      <body>
        <AppHeader name={NAME} />
        <StatusPage {...STATUSES.serverError} onRetry={reset} />
      </body>
    </html>
  );
};

export default GlobalError;
