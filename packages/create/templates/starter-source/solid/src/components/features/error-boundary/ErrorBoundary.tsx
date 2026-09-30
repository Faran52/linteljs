import { ErrorBoundary as SolidErrorBoundary, type JSX } from 'solid-js';

import { STATUSES } from '../../../config/statuses';
import { StatusPage } from '../status-page/StatusPage';

export interface ErrorBoundaryProps {
  readonly children: JSX.Element;
}

export const ErrorBoundary = (props: ErrorBoundaryProps): JSX.Element => {
  return (
    <SolidErrorBoundary fallback={(_error, reset) => {
      return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
    }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
};
