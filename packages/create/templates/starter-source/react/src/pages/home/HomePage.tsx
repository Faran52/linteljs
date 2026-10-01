import { CHECK } from '@config/linteljs';

import { Mark } from '@ui';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage: FC<HomePageProps> = ({ name }) => {
  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{name}</h1>
      <p className="lede">React, Vite and the standard already applied.</p>
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
