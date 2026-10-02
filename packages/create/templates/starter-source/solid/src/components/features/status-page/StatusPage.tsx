import {
  createMemo,
  type JSX,
  Show,
} from 'solid-js';

import { Button } from '@ui';

export interface StatusPageProps {
  readonly code: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

// Home is a full load, so a crash leaves no state behind.
export const StatusPage = (props: StatusPageProps): JSX.Element => {
  const actionClasses = createMemo(() => {
    const classList = { 'status-action-outline': props.onRetry !== undefined };

    return classList;
  });

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
        {/* `href` first: Solid writes the template unquoted, and happy-dom reads a closing `href=/>` as empty. */}
        <a
          href="/"
          class="status-action"
          classList={actionClasses()}
        >
          Go home
        </a>
      </div>
    </main>
  );
};
