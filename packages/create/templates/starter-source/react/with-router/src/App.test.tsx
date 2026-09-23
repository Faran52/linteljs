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

/*
 * One suite for both routers, because what a router changes is the same either way: the tabs are real links and
 * the address bar follows them. Asynchronous throughout, since both libraries resolve a route before they render
 * it.
 */
describe('App', () => {
  it('opens on the home page', async () => {
    render(wrapped(<App />));

    expect(await screen.findByRole('img', { name: 'linteljs' })).toBeTruthy();
  });

  it('routes from the header, and the address bar follows', async () => {
    render(wrapped(<App />));
    fireEvent.click(await screen.findByRole('link', { name: 'About' }));

    expect(await screen.findByRole('heading', { name: 'About' })).toBeTruthy();
    expect(window.location.pathname).toBe('/about');
  });
});
