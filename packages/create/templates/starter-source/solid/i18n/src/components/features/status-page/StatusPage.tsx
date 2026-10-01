import { type JSX, Show } from 'solid-js';

import { type MessageKey, t } from '../../../i18n';
import { Button } from '../../ui';

export interface StatusPageProps {
  readonly code: number;
  // A key into `src/i18n/locales/`, as `STATUSES` holds it.
  readonly message: MessageKey;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage = (props: StatusPageProps): JSX.Element => {
  return (
    <main class="status">
      <h1 class="status-code">{props.code}</h1>
      <p class="status-message" role="alert">{t(props.message)}</p>
      <div class="status-actions">
        <Show when={props.onRetry}>
          {(retry) => {
            return <Button onClick={retry()}>{t('statusRetry')}</Button>;
          }}
        </Show>
        {/* `href` first: Solid writes the template unquoted, and happy-dom reads a closing `href=/>` as empty. */}
        <a
          href="/"
          class="status-action"
          classList={{ 'status-action-outline': props.onRetry !== undefined }}
        >
          {t('statusHome')}
        </a>
      </div>
    </main>
  );
};
