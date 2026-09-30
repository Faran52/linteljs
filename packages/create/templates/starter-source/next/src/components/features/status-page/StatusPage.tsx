import Link from 'next/link';

import { Button } from '../../ui';

import type { FC } from 'react';

export interface StatusPageProps {
  readonly code: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

// `Link`, not an anchor: `@next/next/no-html-link-for-pages` refuses a bare one.
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
        <Link className={onRetry === undefined ? 'status-action' : 'status-action status-action-outline'} href="/">
          Go home
        </Link>
      </div>
    </main>
  );
};
