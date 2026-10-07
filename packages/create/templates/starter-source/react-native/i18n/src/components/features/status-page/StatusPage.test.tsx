import {
  act,
  fireEvent,
  screen,
} from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';
import { languages, resources } from '@/i18n/config';
import { MAX_FONT_SCALE } from '@/styles/starterStyles';

import { StatusPage } from './StatusPage';

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

  // At the largest system text a three-digit code would otherwise break across lines.
  it('caps how far the code grows with the system text size', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const element = screen.getByText('500');
    expect(element.props.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  });

  it('offers a retry when it is given one', async () => {
    const retry = jest.fn();

    await renderScreen(
      <StatusPage
        code={code}
        message={message}
        onRetry={retry}
      />,
    );

    await fireEvent.press(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('speaks the language chosen, the message and both actions', async () => {
    await renderScreen(
      <StatusPage
        code={code}
        message={message}
        onRetry={jest.fn()}
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

  it('is the one main landmark on the page', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
  });
});
