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

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    expect(home.getAttribute('href')).toBe('/');
    expect(home.classList.contains('status-action-outline')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
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

    expect(retried).toEqual(['retry']);
    expect(home.classList.contains('status-action-outline')).toBe(true);
  });
});
