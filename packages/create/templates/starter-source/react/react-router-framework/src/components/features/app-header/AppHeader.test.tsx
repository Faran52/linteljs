import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ROUTES } from '@pages/routes';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
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

  it('marks the page it is on', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AppHeader name="my-app" />
      </MemoryRouter>,
    );

    const attribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
  });
});
