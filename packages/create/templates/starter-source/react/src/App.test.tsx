import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { App } from './App';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';

import type { ReactNode } from 'react';

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
