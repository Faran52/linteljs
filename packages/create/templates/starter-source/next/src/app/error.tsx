'use client';

import { StatusPage } from '../components/features/status-page/StatusPage';
import { STATUSES } from '../config/statuses';

import type { ReactNode } from 'react';

interface ErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

// Next wraps every page below the layout in this boundary, so the header stays.
const RouteError = ({ reset }: ErrorProps): ReactNode => {
  return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
};

export default RouteError;
