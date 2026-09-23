import { pathnameMock } from '@mocks/setupTests';
import { render, screen } from '@testing-library/react';

import { PAGES } from '../../../config/routes';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('names the project and links every page the route list names', () => {
    render(<AppHeader name="my-app" />);

    expect(screen.getByText('my-app')).toBeTruthy();

    for (const { label } of PAGES) {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    }
  });

  // The tabs are links, so the page they are on is said out loud rather than shown. The suite renders no router,
  // so `usePathname` is stood in for at the root.
  it('marks the page it is on for a screen reader', () => {
    pathnameMock.mockReturnValue('/about');
    render(<AppHeader name="my-app" />);

    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });
});
