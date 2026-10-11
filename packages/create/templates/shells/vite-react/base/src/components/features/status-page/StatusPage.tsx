import { useTranslation } from 'react-i18next';

import { Button } from '@ui';

import { styles } from './StatusPage.styles';

import type { FC } from 'react';

export interface StatusPageProps {
  readonly code: number;
  // A key into `src/i18n/locales/`, as `STATUSES` holds it.
  readonly message: string;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage: FC<StatusPageProps> = ({
  code,
  message,
  onRetry,
}) => {
  const { t } = useTranslation();

  return (
    <main {...styles.status}>
      <h1 {...styles.statusCode}>{code}</h1>
      <p {...styles.statusMessage} role="alert">{t(message)}</p>
      <div {...styles.statusActions}>
        {onRetry === undefined ? null : <Button onClick={onRetry} size="lg">{t('statusRetry')}</Button>}
        <a
          {...styles.action(onRetry !== undefined)}
          href="/"
        >
          {t('statusHome')}
        </a>
      </div>
    </main>
  );
};
