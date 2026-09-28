import { Mark } from '../../components/ui';
import { CHECK } from '../../config/linteljs';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  return (
    <main class="hero">
      <Mark />
      <h1 class="title">{props.name}</h1>
      <p class="lede">Solid, Vite and the standard already applied.</p>
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
