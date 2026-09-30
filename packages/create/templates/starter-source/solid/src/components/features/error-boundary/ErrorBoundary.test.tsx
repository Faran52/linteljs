import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { ErrorBoundary } from './ErrorBoundary';

import type { JSX } from 'solid-js';

const failure = { armed: true };

const Flaky = (): JSX.Element => {
  if (failure.armed) {
    throw new Error('render failed');
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
  });

  it('shows the 500 page in place of a child that throws', () => {
    renderFlaky();

    expect(screen.getByRole('heading', { name: '500' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
  });

  it('renders the child again on retry', () => {
    renderFlaky();
    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Rendered')).toBeTruthy();
  });
});
