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
    <main className="hero">
      <h1 className="title">{code}</h1>
      <p className="lede" role="alert">{message}</p>
      <p className="hint">
        {onRetry === undefined ? null : <Button onClick={onRetry}>Try again</Button>}
        {' '}
        <a href="/">Go home</a>
      </p>
    </main>
  );
};
