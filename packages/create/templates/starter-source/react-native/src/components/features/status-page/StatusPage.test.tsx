import { fireEvent, screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';
import { MAX_FONT_SCALE } from '@/styles/starterStyles';

import { StatusPage } from './StatusPage';

const { code, message } = STATUSES.serverError;

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const alert = screen.getByRole('alert');
    const home = screen.getByText('Go home');

    const element = screen.getByText('500');
    expect(element).toBeTruthy();
    expect(alert.props.children).toBe(message);
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

  it('is the one main landmark on the page', async () => {
    await renderScreen(<StatusPage code={code} message={message} />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
  });
});
