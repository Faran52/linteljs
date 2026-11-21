import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';

import { ForbiddenError } from '@utils/statusUtils';

import { RouteError } from './RouteError';

export const routerHelpers = (): void => {
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
};

export const routerReset = (): void => {
  failure.armed = true;
  failure.error = new Error('render failed');
};

export const routerCases = (): void => {};

export const routerForbid = (): void => {
  failure.error = new ForbiddenError();
};

export const routerRender = (): void => {
  renderFlaky();
};

export const retryTitle = 'shows the 500 page for a route that throws, and renders it again on retry';

export const routerDisarm = (): void => {
  failure.armed = false;
};

export const routerRetried = async (): Promise<void> => {
  const renderedElement = await screen.findByText('Rendered');
  expect(renderedElement).toBeTruthy();
};
