import { CHECK } from '@config/linteljs';

import { createCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  const counter = createCounter();

  return (
    <main class="hero">
      <Mark />
      <h1 class="title">{props.name}</h1>
      <p class="lede">Solid, Vite and the standard already applied.</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div class="counter">
        <span class="count" aria-live="polite">{counter.count()}</span>
        <Button onClick={counter.add}>Add one</Button>
      </div>
      <p class="caption">Held in a store, across every page.</p>

      <p class="hint">
        Run
        {' '}
        <code>{CHECK}</code>
        {' '}
        for the full gate.
      </p>
    </main>
  );
};
