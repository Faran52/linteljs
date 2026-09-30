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
    <main className="hero">
      <h1 className="title">{code}</h1>
      <p className="lede" role="alert">{message}</p>
      <p className="hint">
        {onRetry === undefined ? null : <Button onClick={onRetry}>Try again</Button>}
        {' '}
        <Link href="/">Go home</Link>
      </p>
    </main>
  );
};
