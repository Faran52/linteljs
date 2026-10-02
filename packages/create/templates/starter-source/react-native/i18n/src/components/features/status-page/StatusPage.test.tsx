import {
  act,
  fireEvent,
  screen,
} from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';
import { languages, resources } from '@/i18n/config';

import { StatusPage } from './StatusPage';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  const expoRouter = { Link: Text };

  return expoRouter;
});

const { code, message } = STATUSES.serverError;
const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('announces the status under its code, with a way home and nothing to retry', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const alert = screen.getByRole('alert');
    const home = screen.getByText('Go home');

    const element = screen.getByText('500');
    expect(element).toBeTruthy();
    expect(alert.props.children).toBe(resources.en.common[message]);
    expect(home.props.href).toBe('/');
    const buttonElement = screen.queryByRole('button');
    expect(buttonElement).toBeNull();
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

  it('speaks the language chosen, the message and both actions', async () => {
    await renderScreen(
      <StatusPage
        code={code}
        message={message}
        onRetry={vi.fn()}
      />,
    );

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];

    const alert = screen.getByRole('alert');
    const retry = screen.getByText(common.statusRetry);
    const home = screen.getByText(common.statusHome);

    expect(alert.props.children).toBe(common[message]);
    expect(retry).toBeTruthy();
    expect(home).toBeTruthy();
  });
});
