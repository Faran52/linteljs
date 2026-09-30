import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { STATUSES } from '../../../config/statuses';

import { StatusPage } from './StatusPage';

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(() => {
      return <StatusPage {...STATUSES.notFound} />;
    });

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
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

    expect(retried).toEqual(['retry']);
  });
});
