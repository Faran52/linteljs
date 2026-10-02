import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { STATUSES } from '@config/statuses';

import ErrorPage from './+error.svelte';

vi.mock('$app/navigation', () => {
  return { invalidateAll: vi.fn() };
});

// SvelteKit sets the status before it renders this page, and the suite stands in for it.
const open = (status: number): void => {
  Object.assign(page, { status });
  render(ErrorPage);
};

describe('the error page', () => {
  it.each([STATUSES.forbidden, STATUSES.notFound])('shows the $code page, with nothing to retry', ({
    code,
    message,
  }) => {
    open(code);

    const element = screen.getByRole('heading', { name: String(code) });
    expect(element).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(message);
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('shows the 500 page for a crash, and runs the failed load again on retry', async () => {
    open(500);

    const element = screen.getByRole('heading', { name: '500' });
    expect(element).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(invalidateAll).toHaveBeenCalledOnce();
  });
});
