import { Button, Mark } from '../../components/ui';
import { CHECK } from '../../config/linteljs';
import { useCounter } from '../../lib/store/counter/counterStore';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{name}</h1>
      <p className="lede">React, Vite and the standard already applied.</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div className="counter">
        <span className="count" aria-live="polite">{count}</span>
        <Button onClick={add}>Add one</Button>
      </div>
      <p className="caption">Held in a store, across every page.</p>

      <p className="hint">
        Run
        {' '}
        <code>{CHECK}</code>
        {' '}
        for the full gate.
      </p>
    </main>
  );
};
