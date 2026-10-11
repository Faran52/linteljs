import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ROUTES } from '@router/router';

import { AppHeader } from './AppHeader';
import { styles } from './AppHeader.styles';

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
    // StyleX types className as optional; join reads a missing one as empty.
    const missing = [styles.tab(true).className]
      .join(' ')
      .split(' ')
      .filter((name) => {
        return !link.classList.contains(name);
      });
    expect(missing).toEqual([]);
  });
});
