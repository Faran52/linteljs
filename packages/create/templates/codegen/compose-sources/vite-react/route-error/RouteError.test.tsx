import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { ForbiddenError } from '@utils/statusUtils';

import { RouteError } from './RouteError';
import {
  retryTitle,
  routerCases,
  routerDisarm,
  routerForbid,
  routerHelpers,
  routerRender,
  routerReset,
  routerRetried,
} from './router';

routerHelpers();

describe('RouteError', () => {
  beforeEach(() => {
    routerReset();

    // React reports every caught render error, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  routerCases();

  it('shows the 403 page, with no retry, for a route that throws a ForbiddenError', async () => {
    routerForbid();
    routerRender();

    const element = await screen.findByRole('heading', { name: '403' });
    expect(element).toBeTruthy();
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it(retryTitle, async () => {
    routerRender();

    const element = await screen.findByRole('heading', { name: '500' });
    expect(element).toBeTruthy();

    routerDisarm();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await routerRetried();
  });
});
