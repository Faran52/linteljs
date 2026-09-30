import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { ForbiddenError } from '../../../lib/utils/statusUtils';

import { RouteError } from './RouteError';

const failure = {
  armed: true,
  error: new Error('render failed'),
};

const renderFlaky = (): void => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => {
        if (failure.armed) {
          throw failure.error;
        }

        return <p>Rendered</p>;
      },
    }),
    history: createMemoryHistory(),
    defaultErrorComponent: RouteError,
  });

  render(<RouterProvider router={router} />);
};

describe('RouteError', () => {
  beforeEach(() => {
    failure.armed = true;
    failure.error = new Error('render failed');
    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 403 page, with no retry, for a route that throws a ForbiddenError', async () => {
    failure.error = new ForbiddenError();
    renderFlaky();

    expect(await screen.findByRole('heading', { name: '403' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('shows the 500 page for a route that throws, and renders it again on retry', async () => {
    renderFlaky();

    expect(await screen.findByRole('heading', { name: '500' })).toBeTruthy();

    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Rendered')).toBeTruthy();
  });
});
