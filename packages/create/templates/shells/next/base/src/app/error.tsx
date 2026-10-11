'use client';

import { STATUSES } from '@config/statuses';

import { ForbiddenError } from '@utils/statusUtils';

import { StatusPage } from '@features/status-page/StatusPage';

import type { ReactNode } from 'react';

interface ErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

// Next wraps every page below the layout in this boundary, so the header stays. A server component's
// error reaches it stripped of its class, so a ForbiddenError is a 403 only from a client component.
const RouteError = ({ error, reset }: ErrorProps): ReactNode => {
  if (error instanceof ForbiddenError) {
    return <StatusPage {...STATUSES.forbidden} />;
  }

  return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
};

export default RouteError;
