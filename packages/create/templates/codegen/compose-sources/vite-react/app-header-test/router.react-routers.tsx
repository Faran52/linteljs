import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ROUTES } from '@router/router';

import { AppHeader } from './AppHeader';

export const routerHelpers = (): void => {};

export const routerCases = (): void => {
  it('names the project and links every page on the one route list', () => {
    render(
      <MemoryRouter>
        <AppHeader name="my-app" />
      </MemoryRouter>,
    );

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();

    for (const { label, path } of ROUTES) {
      const attribute = screen.getByRole('link', { name: label }).getAttribute('href');
      expect(attribute).toBe(path);
    }
  });

  it('marks the page it is on and styles its tab apart', () => {
    const history = ['/about'];

    render(
      <MemoryRouter initialEntries={history}>
        <AppHeader name="my-app" />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'About' });
    const home = screen.getByRole('link', { name: 'Home' });

    const attribute = link.getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = home.getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
    const currentClass = link.className;
    expect(currentClass).not.toBe(home.className);
  });
};
