'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '../../ui';

import type { FC } from 'react';

export interface StatusPageProps {
  readonly code: number;
  // A key into `src/i18n/locales/`, as `STATUSES` holds it.
  readonly message: string;
  readonly onRetry?: () => void;
}

// A client component, so it speaks the reader's language. `Link`, not an anchor:
// `@next/next/no-html-link-for-pages` refuses a bare one.
export const StatusPage: FC<StatusPageProps> = ({
  code,
  message,
  onRetry,
}) => {
  const t = useTranslations();

  return (
    <main className="status">
      <h1 className="status-code">{code}</h1>
      <p className="status-message" role="alert">{t(message)}</p>
      <div className="status-actions">
        {onRetry === undefined ? null : <Button onClick={onRetry}>{t('statusRetry')}</Button>}
        <Link className={onRetry === undefined ? 'status-action' : 'status-action status-action-outline'} href="/">
          {t('statusHome')}
        </Link>
      </div>
    </main>
  );
};
