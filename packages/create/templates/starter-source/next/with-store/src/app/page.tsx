'use client';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';

import type { ReactNode } from 'react';

// A client component, because a store is state and state is the browser's.
const HomePage = (): ReactNode => {
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">Next, the App Router and the standard already applied.</p>

      {}
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

export default HomePage;
