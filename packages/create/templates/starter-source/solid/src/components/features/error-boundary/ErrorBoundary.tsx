import { ErrorBoundary as SolidErrorBoundary, type JSX } from 'solid-js';

import { STATUSES } from '../../../config/statuses';
import { ForbiddenError } from '../../../lib/utils/statusUtils';
import { StatusPage } from '../status-page/StatusPage';

export interface ErrorBoundaryProps {
  readonly children: JSX.Element;
}

export const ErrorBoundary = (props: ErrorBoundaryProps): JSX.Element => {
  return (
    <SolidErrorBoundary fallback={(error, reset) => {
      // Trying again cannot grant access.
      if (error instanceof ForbiddenError) {
        return <StatusPage {...STATUSES.forbidden} />;
      }

      return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
    }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
};
