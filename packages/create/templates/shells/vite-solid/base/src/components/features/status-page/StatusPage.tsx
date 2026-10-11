import {
  type JSX,
  Show,
} from 'solid-js';

import { type MessageKey, t } from '@i18n/i18n';

import { Button } from '@ui';

import { styles } from './StatusPage.styles';

export interface StatusPageProps {
  readonly code: number;
  // A key into `src/i18n/locales/`, as `STATUSES` holds it.
  readonly message: MessageKey;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage = (props: StatusPageProps): JSX.Element => {
  return (
    <main {...styles.status}>
      <h1 {...styles.statusCode}>{props.code}</h1>
      <p {...styles.statusMessage} role="alert">{t(props.message)}</p>
      <div {...styles.statusActions}>
        <Show when={props.onRetry}>
          {(retry) => {
            return <Button onClick={retry()} size="lg">{t('statusRetry')}</Button>;
          }}
        </Show>
        {/* `href` first: Solid writes the template unquoted, and happy-dom reads a closing `href=/>` as empty. */}
        <a
          href="/"
          {...styles.action(props.onRetry !== undefined)}
        >
          {t('statusHome')}
        </a>
      </div>
    </main>
  );
};
