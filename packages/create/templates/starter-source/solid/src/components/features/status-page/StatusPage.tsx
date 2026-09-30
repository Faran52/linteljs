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
    <main class="hero">
      <h1 class="title">{props.code}</h1>
      <p class="lede" role="alert">{props.message}</p>
      <p class="hint">
        <Show when={props.onRetry}>
          {(retry) => {
            return <Button onClick={retry()}>Try again</Button>;
          }}
        </Show>
        {' '}
        {/* A second attribute: alone, Solid writes `<a href=/>`, which parses as an empty href. */}
        <a href="/" target="_self">Go home</a>
      </p>
    </main>
  );
};
