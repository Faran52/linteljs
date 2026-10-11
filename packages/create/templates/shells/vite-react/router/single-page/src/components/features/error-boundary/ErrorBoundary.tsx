import { Component, type ReactNode } from 'react';

import { STATUSES } from '@config/statuses';

import { ForbiddenError } from '@utils/statusUtils';

import { StatusPage } from '../status-page/StatusPage';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
  readonly forbidden: boolean;
}

// A class: React catches a render error only in `getDerivedStateFromError`, which has no hook.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    failed: false,
    forbidden: false,
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const state = {
      failed: true,
      forbidden: error instanceof ForbiddenError,
    };

    return state;
  }

  override render(): ReactNode {
    // A fragment, so both branches are one type.
    if (!this.state.failed) {
      return <>{this.props.children}</>;
    }

    // Trying again cannot grant access.
    if (this.state.forbidden) {
      return <StatusPage {...STATUSES.forbidden} />;
    }

    return (
      <StatusPage
        {...STATUSES.serverError}
        onRetry={() => {
          this.setState({
            failed: false,
            forbidden: false,
          });
        }}
      />
    );
  }
}
