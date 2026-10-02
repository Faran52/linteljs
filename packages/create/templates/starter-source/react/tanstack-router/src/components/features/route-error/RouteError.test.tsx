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

import { ForbiddenError } from '@utils/statusUtils';

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

    const element = await screen.findByRole('heading', { name: '403' });
    expect(element).toBeTruthy();
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('shows the 500 page for a route that throws, and renders it again on retry', async () => {
    renderFlaky();

    const element = await screen.findByRole('heading', { name: '500' });
    expect(element).toBeTruthy();

    failure.armed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const renderedElement = await screen.findByText('Rendered');
    expect(renderedElement).toBeTruthy();
  });
});
