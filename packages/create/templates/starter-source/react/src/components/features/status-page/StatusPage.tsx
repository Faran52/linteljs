import { Button } from '../../ui';

import type { FC } from 'react';

export interface StatusPageProps {
  readonly code: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage: FC<StatusPageProps> = ({
  code,
  message,
  onRetry,
}) => {
  return (
    <main className="status">
      <h1 className="status-code">{code}</h1>
      <p className="status-message" role="alert">{message}</p>
      <div className="status-actions">
        {onRetry === undefined ? null : <Button onClick={onRetry}>Try again</Button>}
        <a className={onRetry === undefined ? 'status-action' : 'status-action status-action-outline'} href="/">
          Go home
        </a>
      </div>
    </main>
  );
};
