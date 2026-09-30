import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { ForbiddenError } from '../../../lib/utils/statusUtils';

import { ErrorBoundary } from './ErrorBoundary';

import type { JSX } from 'solid-js';

const failure = {
  armed: true,
  error: new Error('render failed'),
};

const Flaky = (): JSX.Element => {
  if (failure.armed) {
    throw failure.error;
  }

  return <p>Rendered</p>;
};

const renderFlaky = (): void => {
  render(() => {
    return (
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );
  });
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    failure.armed = true;
    failure.error = new Error('render failed');
  });

  it('shows the 500 page in place of a child that throws', () => {
    renderFlaky();

    expect(screen.getByRole('heading', { name: '500' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
  });

  it('shows the 403 page, with no retry, for a child that throws a ForbiddenError', () => {
    failure.error = new ForbiddenError();
    renderFlaky();

    expect(screen.getByRole('heading', { name: '403' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('renders the child again on retry', () => {
    renderFlaky();
    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Rendered')).toBeTruthy();
  });
});
