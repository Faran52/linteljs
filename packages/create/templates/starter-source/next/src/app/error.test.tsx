import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import RouteError from './error';

// Next mounts this file as the boundary itself, which runs only inside its app router, so the case is the fallback.
describe('the error route', () => {
  it('shows the 500 page and hands the retry to Next', () => {
    const reset = vi.fn();

    render(<RouteError error={new Error('render failed')} reset={reset} />);

    expect(screen.getByRole('heading', { name: '500' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
