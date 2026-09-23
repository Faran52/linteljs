import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { App } from './App';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';
import { ROUTES } from './pages/routes';

import type { JSX } from 'solid-js';

/*
 * Through both slots, the way the entry wraps the application. TanStack Query needs its client and a store may
 * need an ancestor, so a page that reads either renders nothing without them; with the other answers both are
 * pass-throughs and this costs a component each.
 *
 * A thunk, not an element: Solid builds JSX where it is written, so an element passed as an argument is created
 * outside the providers and reads none of their context.
 */
const open = (ui: () => JSX.Element): void => {
  render(() => {
    return (
      <StoreProvider>
        <DataProvider>{ui()}</DataProvider>
      </StoreProvider>
    );
  });
};

describe('App', () => {
  it('opens on the home page', () => {
    open(() => {
      return <App />;
    });

    expect(screen.getByRole('img', { name: 'linteljs' })).toBeTruthy();
  });

  /*
   * Without a router the header swaps the page from a signal and the address bar never moves. Every page the route
   * list names, so one the form answer adds is opened here without this file changing; home is skipped because its
   * heading is the project's name rather than its label.
   */
  it('swaps to every page the header names, leaving the address bar alone', () => {
    open(() => {
      return <App />;
    });

    for (const route of ROUTES.slice(1)) {
      fireEvent.click(screen.getByRole('button', { name: route.label }));

      expect(screen.getByRole('heading', { name: route.label })).toBeTruthy();
    }

    expect(screen.queryByRole('img', { name: 'linteljs' })).toBeNull();
  });

  it('opens on the page it was given', () => {
    open(() => {
      return <App initialPage="version" />;
    });

    expect(screen.getByRole('heading', { name: 'Version' })).toBeTruthy();
  });
});
