import { Mark } from '../components/ui';
import { NAME } from '../config/linteljs';

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
        <code>pnpm check</code>
        {' '}
        for lint, types, tests and build.
      </p>
    </main>
  );
};

export default HomePage;
