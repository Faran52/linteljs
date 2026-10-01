import { STATUSES } from '@config/statuses';

import { ForbiddenError } from '@utils/statusUtils';

import { StatusPage } from '../status-page/StatusPage';

import type { ErrorComponentProps } from '@tanstack/react-router';
import type { FC } from 'react';

// Trying again cannot grant access, so the 403 page offers home alone.
export const RouteError: FC<ErrorComponentProps> = ({ error, reset }) => {
  if (error instanceof ForbiddenError) {
    return <StatusPage {...STATUSES.forbidden} />;
  }

  return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
};
