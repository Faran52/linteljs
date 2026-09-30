import { useTranslation } from 'react-i18next';

import { Button } from '../../ui';

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
    <main className="status">
      <h1 className="status-code">{code}</h1>
      <p className="status-message" role="alert">{t(message)}</p>
      <div className="status-actions">
        {onRetry === undefined ? null : <Button onClick={onRetry}>{t('statusRetry')}</Button>}
        <a className={onRetry === undefined ? 'status-action' : 'status-action status-action-outline'} href="/">
          {t('statusHome')}
        </a>
      </div>
    </main>
  );
};
