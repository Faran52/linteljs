import { CHECK, NAME } from '@config/linteljs';

import { Mark } from '@ui';

import type { ReactNode } from 'react';

const HomePage = (): ReactNode => {
  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">Next, the App Router and the standard already applied.</p>
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
