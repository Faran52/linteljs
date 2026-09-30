import { type JSX, Show } from 'solid-js';

import { Button } from '../../ui';

export interface StatusPageProps {
  readonly code: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage = (props: StatusPageProps): JSX.Element => {
  return (
    <main class="status">
      <h1 class="status-code">{props.code}</h1>
      <p class="status-message" role="alert">{props.message}</p>
      <div class="status-actions">
        <Show when={props.onRetry}>
          {(retry) => {
            return <Button onClick={retry()}>Try again</Button>;
          }}
        </Show>
        <a
          class="status-action"
          classList={{ 'status-action-outline': props.onRetry !== undefined }}
          href="/"
        >
          Go home
        </a>
      </div>
    </main>
  );
};
