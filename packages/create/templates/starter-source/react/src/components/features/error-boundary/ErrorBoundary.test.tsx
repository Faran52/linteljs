import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { ErrorBoundary } from './ErrorBoundary';

import type { FC } from 'react';

const failure = { armed: true };

const Flaky: FC = () => {
  if (failure.armed) {
    throw new Error('render failed');
  }

  return <p>Rendered</p>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    failure.armed = true;
    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 500 page in place of a child that throws', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);

    expect(screen.getByRole('heading', { name: '500' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
  });

  it('renders the child again on retry', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);
    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Rendered')).toBeTruthy();
  });
});
