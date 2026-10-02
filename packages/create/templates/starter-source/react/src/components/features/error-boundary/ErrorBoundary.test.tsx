import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { ForbiddenError } from '@utils/statusUtils';

import { ErrorBoundary } from './ErrorBoundary';

import type { FC } from 'react';

const failure = {
  armed: true,
  error: new Error('render failed'),
};

const Flaky: FC = () => {
  if (failure.armed) {
    throw failure.error;
  }

  return <p>Rendered</p>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    failure.armed = true;
    failure.error = new Error('render failed');

    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 500 page in place of a child that throws', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);

    const element = screen.getByRole('heading', { name: '500' });
    expect(element).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
  });

  it('shows the 403 page, with no retry, for a child that throws a ForbiddenError', () => {
    failure.error = new ForbiddenError();
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);

    const element = screen.getByRole('heading', { name: '403' });
    expect(element).toBeTruthy();
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('renders the child again on retry', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);
    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const element = screen.getByText('Rendered');
    expect(element).toBeTruthy();
  });
});
