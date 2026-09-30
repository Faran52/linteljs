import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { App } from './App';
import { DataProvider } from './lib/providers/data/DataProvider';
import { StoreProvider } from './lib/providers/store/StoreProvider';

import type { ReactNode } from 'react';

const wrapped = (ui: ReactNode): ReactNode => {
  return (
    <StoreProvider>
      <DataProvider>{ui}</DataProvider>
    </StoreProvider>
  );
};

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

  it('shows the 404 page, under the header, for a path no route matches', async () => {
    render(wrapped(<App />));
    window.history.pushState({}, '', '/missing');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(await screen.findByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByText('LintelJS Starter')).toBeTruthy();
  });
});
