import { render, screen } from '@testing-library/react';

import { PAGES } from '@config/routes';

import { pathnameMock } from '@mocks/setupTests';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('names the project and links every page the route list names', () => {
    render(<AppHeader name="my-app" />);

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();

    for (const { label } of PAGES) {
      const element = screen.getByRole('link', { name: label });
      expect(element).toBeTruthy();
    }
  });

  it('marks the page it is on for a screen reader', () => {
    pathnameMock.mockReturnValue('/about');
    render(<AppHeader name="my-app" />);

    const attribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
  });
});
