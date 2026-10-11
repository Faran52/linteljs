import {
  createMemoryRouter,
  type HydrationState,
  RouterProvider,
  useNavigate,
} from 'react-router';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { ForbiddenError } from '@utils/statusUtils';

import { RouteError } from './RouteError';

import type { FC } from 'react';

const crash = { error: new Error('render failed') };

const Crashing: FC = () => {
  throw crash.error;
};

const renderAt = (path: string, hydrationData: HydrationState = {}): void => {
  const router = createMemoryRouter([
    {
      id: 'root',
      path: '/',
      element: <Crashing />,
      errorElement: <RouteError />,
    },
  ], {
    initialEntries: [path],
    hydrationData,
  });

  render(<RouterProvider router={router} />);
};

describe('RouteError', () => {
  beforeEach(() => {
    crash.error = new Error('render failed');

    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 404 page for a path no route matches', async () => {
    renderAt('/missing');

    const element = await screen.findByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('shows the 403 page for a route that refuses', async () => {
    // The shape a loader's `throw data(null, { status: 403 })` arrives in.
    renderAt('/', { errors: { root: {
      status: 403,
      statusText: 'Forbidden',
      internal: false,
      data: null,
    } } });

    const element = await screen.findByRole('heading', { name: '403' });
    expect(element).toBeTruthy();
  });

  it('shows the 403 page, with no retry, for a route that throws a ForbiddenError', async () => {
    crash.error = new ForbiddenError();
    renderAt('/');

    const element = await screen.findByRole('heading', { name: '403' });
    expect(element).toBeTruthy();
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('shows the 500 page for a route that throws, and retries by navigating to the same place', async () => {
    renderAt('/');

    const element = await screen.findByRole('heading', { name: '500' });
    expect(element).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // The setup's `useNavigate` hands every caller the one mock.
    const navigate = vi.mocked(useNavigate)
      .getMockImplementation()?.();

    const expected = { replace: true };
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/' }), expected);
  });
});
