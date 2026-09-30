import { renderScreen } from '@mocks/renderScreen';
import { fireEvent, screen } from '@testing-library/react-native';

import { ForbiddenError } from '../../../lib/utils/statusUtils';

import { CrashPage } from './CrashPage';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
// Its boundary, `Try`, loads the same source, so the suite plays the boundary: an error and a `retry`.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return { Link: Text };
});

describe('CrashPage', () => {
  it('shows the 500 page for a crash, and retries the route when asked', async () => {
    const retry = vi.fn<() => Promise<void>>()
      .mockResolvedValue(undefined);

    await renderScreen(<CrashPage error={new Error('render failed')} retry={retry} />);

    expect(screen.getByText('500')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the 403 page, with no retry, for a ForbiddenError', async () => {
    await renderScreen(<CrashPage error={new ForbiddenError()} retry={vi.fn<() => Promise<void>>()} />);

    expect(screen.getByText('403')).toBeTruthy();
    expect(screen.queryByText('Try again')).toBeNull();
  });
});
