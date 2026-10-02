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

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();
    const buttonElement = screen.getByRole('button', { name: 'Home' });
    expect(buttonElement).toBeTruthy();
    const element2 = screen.getByRole('button', { name: 'About' });
    expect(element2).toBeTruthy();
    const element3 = screen.getByRole('button', { name: 'Version' });
    expect(element3).toBeTruthy();
  });

  it('marks the current page for a screen reader', () => {
    render(
      <AppHeader
        name="my-app"
        current="home"
        onNavigate={onNavigate}
      />,
    );

    const attribute = screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('button', { name: 'About' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
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

    const expected = ['version'];
    expect(chosen).toEqual(expected);
  });
});
