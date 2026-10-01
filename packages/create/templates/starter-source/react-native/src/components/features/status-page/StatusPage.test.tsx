import { fireEvent, screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';

import { StatusPage } from './StatusPage';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return { Link: Text };
});

const { code, message } = STATUSES.serverError;

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const alert = screen.getByRole('alert');
    const home = screen.getByText('Go home');

    expect(screen.getByText('500')).toBeTruthy();
    expect(alert.props.children).toBe(message);
    expect(home.props.href).toBe('/');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers a retry when it is given one', async () => {
    const retry = vi.fn();

    await renderScreen(
      <StatusPage
        code={code}
        message={message}
        onRetry={retry}
      />,
    );
    await fireEvent.press(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledOnce();
  });
});
