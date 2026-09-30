import { STATUSES } from '@config/statuses';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import StatusPage from './StatusPage.svelte';

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(StatusPage, STATUSES.notFound);

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('offers a retry when it is given one', async () => {
    const retried: string[] = [];

    render(StatusPage, {
      ...STATUSES.serverError,
      onretry: () => {
        retried.push('retry');
      },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retried).toEqual(['retry']);
  });
});
