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
