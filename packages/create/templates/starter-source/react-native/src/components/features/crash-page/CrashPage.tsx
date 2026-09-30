import { STATUSES } from '../../../config/statuses';
import { ForbiddenError } from '../../../lib/utils/statusUtils';
import { StatusPage } from '../status-page/StatusPage';

import type { ErrorBoundaryProps } from 'expo-router';
import type { ReactNode } from 'react';

// `_layout.tsx` exports this as its `ErrorBoundary`; `retry` clears the error and renders the route again.
export const CrashPage = ({ error, retry }: ErrorBoundaryProps): ReactNode => {
  // Trying again cannot grant access.
  if (error instanceof ForbiddenError) {
    return <StatusPage {...STATUSES.forbidden} />;
  }

  return (
    <StatusPage
      {...STATUSES.serverError}
      onRetry={() => {
        void retry();
      }}
    />
  );
};
