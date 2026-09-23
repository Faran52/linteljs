import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { StoreProvider } from '../providers/StoreProvider';

import { useCounter } from './counter';

import type { FC } from 'react';

interface ProbeProps {
  readonly label: string;
}

// Through `StoreProvider`, so the one suite covers every store: Redux needs that ancestor and the others ignore it.
const Probe: FC<ProbeProps> = ({ label }) => {
  const { count, add } = useCounter();

  return <button type="button" onClick={add}>{`${label} ${String(count)}`}</button>;
};

describe('useCounter', () => {
  // Two readers rather than one: what a store is for is that the second sees what the first did.
  it('counts up, and every reader sees the same count', () => {
    render(
      <StoreProvider>
        <Probe label="one" />
        <Probe label="two" />
      </StoreProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'one 0' }));

    expect(screen.getByRole('button', { name: 'one 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'two 1' })).toBeTruthy();
  });
});
