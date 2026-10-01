import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { App } from './App';
import { CHECK } from './config/linteljs';
import { DataProvider } from './lib/providers/data/DataProvider';
import { StoreProvider } from './lib/providers/store/StoreProvider';
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

    expect(screen.getByText('LintelJS Starter')).toBeTruthy();
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

  it('gives the about and version pages their copy, every value filled', () => {
    open(() => {
      return <App />;
    });
    fireEvent.click(screen.getByRole('button', { name: 'About' }));

    const about = document.body.textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Version' }));

    const version = document.body.textContent;

    expect(about).toContain('which applies one lint, type, test and agent standard and keeps applying it.');
    expect(about).toContain(`${CHECK} runs them in order, and is what CI runs.`);
    expect(about).toContain('The layers, imported from @linteljs/eslint-config');
    expect(version).toContain('What this project is running, and the answers it was generated from.');
    expect(screen.getByRole('heading', { name: 'Stack' })).toBeTruthy();
  });

  it('opens on the page it was given', () => {
    open(() => {
      return <App initialPage="version" />;
    });

    expect(screen.getByRole('heading', { name: 'Version' })).toBeTruthy();
  });
});
