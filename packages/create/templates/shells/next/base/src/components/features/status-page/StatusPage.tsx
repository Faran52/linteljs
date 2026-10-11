'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@ui';

import { styles } from './StatusPage.styles';

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
    <main {...styles.status}>
      <h1 {...styles.statusCode}>{code}</h1>
      <p {...styles.statusMessage} role="alert">{t(message)}</p>
      <div {...styles.statusActions}>
        {onRetry === undefined ? null : <Button onClick={onRetry}>{t('statusRetry')}</Button>}
        <Link
          {...styles.action(onRetry !== undefined)}
          href="/"
        >
          {t('statusHome')}
        </Link>
      </div>
    </main>
  );
};
