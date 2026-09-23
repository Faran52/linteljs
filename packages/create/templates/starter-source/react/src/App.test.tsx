import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { App } from './App';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';

import type { ReactNode } from 'react';

/*
 * Through both slots, the way the entry wraps the application. Redux is the one store that needs an ancestor, and
 * TanStack Query needs its client, so a page that reads either renders nothing without them; with the other
 * answers both are pass-throughs and this costs a component each.
 */
const wrapped = (ui: ReactNode): ReactNode => {
  return (
    <StoreProvider>
      <DataProvider>{ui}</DataProvider>
    </StoreProvider>
  );
};

describe('App', () => {
  it('opens on the home page', () => {
    render(wrapped(<App />));

    expect(screen.getByRole('img', { name: 'linteljs' })).toBeTruthy();
  });

  /*
   * The whole of what the router answer changes. Without one the header swaps the page from local state and the
   * address bar never moves; the pages themselves are the same files either way.
   */
  it('swaps the page from the header, leaving the address bar alone', () => {
    render(wrapped(<App />));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));

    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'linteljs' })).toBeNull();
  });

  it('opens on the page it was given', () => {
    render(wrapped(<App initialPage="version" />));

    expect(screen.getByRole('heading', { name: 'Version' })).toBeTruthy();
  });
});
