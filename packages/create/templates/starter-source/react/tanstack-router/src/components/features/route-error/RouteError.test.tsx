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

import { RouteError } from './RouteError';

const failure = { armed: true };

const renderFlaky = (): void => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => {
        if (failure.armed) {
          throw new Error('render failed');
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
    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 500 page for a route that throws, and renders it again on retry', async () => {
    renderFlaky();

    expect(await screen.findByRole('heading', { name: '500' })).toBeTruthy();

    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Rendered')).toBeTruthy();
  });
});
