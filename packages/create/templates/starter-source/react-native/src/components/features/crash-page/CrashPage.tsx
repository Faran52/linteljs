import { STATUSES } from '../../../config/statuses';
import { StatusPage } from '../status-page/StatusPage';

import type { ErrorBoundaryProps } from 'expo-router';
import type { ReactNode } from 'react';

const { code, message } = STATUSES.serverError;

// `_layout.tsx` exports this as its `ErrorBoundary`; `retry` clears the error and renders the route again.
export const CrashPage = ({ retry }: ErrorBoundaryProps): ReactNode => {
  return (
    <StatusPage
      code={code}
      message={message}
      onRetry={() => {
        void retry();
      }}
    />
  );
};
