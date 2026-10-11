import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { STATUSES } from '@config/statuses';

import { StatusPage } from './StatusPage';

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(() => {
      return <StatusPage {...STATUSES.notFound} />;
    });

    const home = screen.getByRole('link', { name: 'Go home' });

    const element = screen.getByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    const attribute = home.getAttribute('href');
    expect(attribute).toBe('/');
    const statusActionOutlineContains = home.classList.contains('status-action-outline');
    expect(statusActionOutlineContains).toBe(false);
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('offers a retry when it is given one', () => {
    const retried: string[] = [];

    render(() => {
      return (
        <StatusPage
          {...STATUSES.serverError}
          onRetry={() => {
            retried.push('retry');
          }}
        />
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const home = screen.getByRole('link', { name: 'Go home' });

    const expected = ['retry'];
    expect(retried).toEqual(expected);
    const statusActionOutlineContains = home.classList.contains('status-action-outline');
    expect(statusActionOutlineContains).toBe(true);
  });
});
