import { Component, type ReactNode } from 'react';

import { STATUSES } from '../../../config/statuses';
import { StatusPage } from '../status-page/StatusPage';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

// A class: React catches a render error only in `getDerivedStateFromError`, which has no hook.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override render(): ReactNode {
    // A fragment, so both branches are one type.
    if (!this.state.failed) {
      return <>{this.props.children}</>;
    }

    return (
      <StatusPage
        {...STATUSES.serverError}
        onRetry={() => {
          this.setState({ failed: false });
        }}
      />
    );
  }
}
