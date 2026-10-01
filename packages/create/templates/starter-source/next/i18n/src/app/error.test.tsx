import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { I18nProvider } from '../lib/providers/i18n/I18nProvider';
import { ForbiddenError } from '../lib/utils/statusUtils';

import RouteError from './error';

// Next mounts this file as the boundary itself, which runs only inside its app router, so the case is the fallback.
describe('the error route', () => {
  it('shows the 500 page and hands the retry to Next', () => {
    const reset = vi.fn();

    render(<RouteError error={new Error('render failed')} reset={reset} />, { wrapper: I18nProvider });

    expect(screen.getByRole('heading', { name: '500' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('shows the 403 page, with no retry, for a ForbiddenError', () => {
    render(<RouteError error={new ForbiddenError()} reset={vi.fn()} />, { wrapper: I18nProvider });

    expect(screen.getByRole('heading', { name: '403' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
