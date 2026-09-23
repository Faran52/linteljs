'use client';

import { Button, Mark } from '../components/ui';
import { NAME } from '../config/linteljs';
import { useCounter } from '../lib/store/counter';

import type { ReactNode } from 'react';

// A client component, because a store is state and state is the browser's. The pages with no store stay server-side.
const HomePage = (): ReactNode => {
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">Next, the App Router and the standard already applied.</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div className="counter">
        <span className="count" aria-live="polite">{count}</span>
        <Button onClick={add}>Add one</Button>
      </div>
      <p className="caption">Held in a store, across every page.</p>

      <p className="hint">
        Run
        {' '}
        <code>pnpm check</code>
        {' '}
        for lint, types, tests and build.
      </p>
    </main>
  );
};

export default HomePage;
