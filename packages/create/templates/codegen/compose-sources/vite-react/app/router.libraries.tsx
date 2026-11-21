import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { App } from './App';

import type { ReactNode } from 'react';

export const routerCases = (wrapped: (ui: ReactNode) => ReactNode): void => {
  it('opens on the home page', async () => {
    render(wrapped(<App />));

    const element = await screen.findByRole('img', { name: 'linteljs' });
    expect(element).toBeTruthy();
  });

  it('routes from the header, and the address bar follows', async () => {
    render(wrapped(<App />));
    const link = await screen.findByRole('link', { name: 'About' });

    fireEvent.click(link);

    const element = await screen.findByRole('heading', { name: 'About' });
    expect(element).toBeTruthy();
    expect(window.location.pathname).toBe('/about');
  });

  it('shows the 404 page, under the header, for a path no route matches', async () => {
    render(wrapped(<App />));
    window.history.pushState({}, '', '/missing');
    window.dispatchEvent(new PopStateEvent('popstate'));

    const element = await screen.findByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
    const lintelJsStarterElement = screen.getByText('LintelJS Starter');
    expect(lintelJsStarterElement).toBeTruthy();
  });
};
