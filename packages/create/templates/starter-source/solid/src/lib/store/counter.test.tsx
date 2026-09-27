import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { StoreProvider } from '../providers/StoreProvider';

import { useCounter } from './counter';

import type { JSX } from 'solid-js';

interface ProbeProps {
  readonly label: string;
}

const Probe = (props: ProbeProps): JSX.Element => {
  const counter = useCounter();

  return (
    <button type="button" onClick={counter.add}>
      {`${props.label} ${String(counter.count())}`}
    </button>
  );
};

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', () => {
    render(() => {
      return (
        <StoreProvider>
          <Probe label="one" />
          <Probe label="two" />
        </StoreProvider>
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'one 0' }));

    expect(screen.getByRole('button', { name: 'one 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'two 1' })).toBeTruthy();
  });
});
