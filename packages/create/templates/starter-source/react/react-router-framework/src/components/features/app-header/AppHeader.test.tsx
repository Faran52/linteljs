import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ROUTES } from '../../../pages/routes';

import { AppHeader } from './AppHeader';

/*
 * Framework mode has no `App` for the header's suite to ride along with, so it is stood up on its own. `NavLink`
 * needs a router above it and `MemoryRouter` is the one that needs no browser, which is all the header asks for.
 */
describe('AppHeader', () => {
  it('names the project and links every page on the one route list', () => {
    render(
      <MemoryRouter>
        <AppHeader name="my-app" />
      </MemoryRouter>,
    );

    expect(screen.getByText('my-app')).toBeTruthy();

    for (const { label, path } of ROUTES) {
      expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(path);
    }
  });

  // A link is an anchor and the router marks the one you are on, which is what a screen reader reads out.
  it('marks the page it is on', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AppHeader name="my-app" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });
});
