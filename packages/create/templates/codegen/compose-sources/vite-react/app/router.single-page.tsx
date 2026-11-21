import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { App } from './App';

import type { ReactNode } from 'react';

export const routerCases = (wrapped: (ui: ReactNode) => ReactNode): void => {
  it('opens on the home page', () => {
    render(wrapped(<App />));

    const element = screen.getByRole('img', { name: 'linteljs' });
    expect(element).toBeTruthy();
  });

  it('swaps the page from the header, leaving the address bar alone', () => {
    render(wrapped(<App />));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));

    const element = screen.getByRole('heading', { name: 'About' });
    expect(element).toBeTruthy();
    const imgElement = screen.queryByRole('img', { name: 'linteljs' });
    expect(imgElement).toBeNull();
  });

  it('opens on the page it was given', () => {
    render(wrapped(<App initialPage="version" />));

    const element = screen.getByRole('heading', { name: 'Version' });
    expect(element).toBeTruthy();
  });
};
