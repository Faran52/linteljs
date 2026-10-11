import { fireEvent, screen } from '@testing-library/react-native';

import { ForbiddenError } from '@utils/statusUtils';

import { renderScreen } from '@mocks/renderScreen';

import { CrashPage } from './CrashPage';

describe('CrashPage', () => {
  it('shows the 500 page for a crash, and retries the route when asked', async () => {
    const retry = jest.fn<Promise<void>, []>()
      .mockResolvedValue(undefined);

    await renderScreen(<CrashPage error={new Error('render failed')} retry={retry} />);

    const element = screen.getByText('500');
    expect(element).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows the 403 page, with no retry, for a ForbiddenError', async () => {
    await renderScreen(<CrashPage error={new ForbiddenError()} retry={jest.fn<Promise<void>, []>()} />);

    const element = screen.getByText('403');
    expect(element).toBeTruthy();
    const tryAgainElement = screen.queryByText('Try again');
    expect(tryAgainElement).toBeNull();
  });
});
