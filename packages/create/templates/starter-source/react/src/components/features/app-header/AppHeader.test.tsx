import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { AppHeader } from './AppHeader';

const chosen: string[] = [];

const onNavigate = (page: string): void => {
  chosen.push(page);
};

describe('AppHeader', () => {
  beforeEach(() => {
    chosen.length = 0;
  });

  it('names the project and every page', () => {
    render(
      <AppHeader
        name="my-app"
        current="home"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('my-app')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Version' })).toBeTruthy();
  });

  it('marks the current page for a screen reader', () => {
    render(
      <AppHeader
        name="my-app"
        current="home"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'About' }).getAttribute('aria-current')).toBeNull();
  });

  it('answers with the page that was chosen', () => {
    render(
      <AppHeader
        name="my-app"
        current="home"
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Version' }));

    expect(chosen).toEqual(['version']);
  });
});
