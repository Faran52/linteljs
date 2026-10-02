import { fireEvent, screen } from '@testing-library/react-native';

import { ForbiddenError } from '@utils/statusUtils';

import { renderScreen } from '@mocks/renderScreen';

import { CrashPage } from './CrashPage';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
// Its boundary, `Try`, loads the same source, so the suite plays the boundary: an error and a `retry`.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  const expoRouter = { Link: Text };

  return expoRouter;
});

describe('CrashPage', () => {
  it('shows the 500 page for a crash, and retries the route when asked', async () => {
    const retry = vi.fn<() => Promise<void>>()
      .mockResolvedValue(undefined);

    await renderScreen(<CrashPage error={new Error('render failed')} retry={retry} />);

    const element = screen.getByText('500');
    expect(element).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the 403 page, with no retry, for a ForbiddenError', async () => {
    await renderScreen(<CrashPage error={new ForbiddenError()} retry={vi.fn<() => Promise<void>>()} />);

    const element = screen.getByText('403');
    expect(element).toBeTruthy();
    const tryAgainElement = screen.queryByText('Try again');
    expect(tryAgainElement).toBeNull();
  });
});
