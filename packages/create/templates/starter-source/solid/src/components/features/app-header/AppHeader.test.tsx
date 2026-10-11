import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { ROUTES } from '@router/router';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('names the project and holds a tab for every route', () => {
    render(() => {
      return (
        <AppHeader
          name="my-app"
          current="home"
          onNavigate={() => {
            return undefined;
          }}
        />
      );
    });

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();
    const labels = screen.getAllByRole('button')
      .map((tab) => {
        return tab.textContent;
      });
    const expected = ROUTES
      .map((route) => {
        return route.label;
      });
    expect(labels).toEqual(expected);
  });

  it('marks the page it is on, and reports the page clicked', () => {
    const visited: string[] = [];

    render(() => {
      return (
        <AppHeader
          name="my-app"
          current="about"
          onNavigate={(page) => {
            visited.push(page);
          }}
        />
      );
    });

    const current = screen.getByRole('button', { current: 'page' });
    const other = screen.getByRole('button', { name: 'Version' });

    fireEvent.click(other);

    expect(current.textContent).toBe('About');
    const currentClass = current.getAttribute('class');
    const otherClass = other.getAttribute('class');
    expect(currentClass).not.toBe(otherClass);
    const expected = ['version'];
    expect(visited).toEqual(expected);
  });
});
