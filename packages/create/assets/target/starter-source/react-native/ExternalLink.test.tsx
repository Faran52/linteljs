import {
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { Text } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';

import { ExternalLink } from './ExternalLink';

vi.mock('expo-router', async () => {
  const { Pressable } = await vi.importActual<typeof import('react-native')>('react-native');

  return { Link: Pressable };
});

vi.mock('expo-web-browser', () => {
  return {
    openBrowserAsync: vi.fn(() => {
      return Promise.resolve();
    }),
    WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
  };
});

const HREF = 'https://docs.expo.dev';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('ExternalLink', () => {
  it('opens the in-app browser and stops the default navigation on native', async () => {
    vi.stubEnv('EXPO_OS', 'ios');

    const user = userEvent.setup();

    await render(<ExternalLink href={HREF}><Text>docs</Text></ExternalLink>);
    await user.press(screen.getByText('docs'));

    expect(openBrowserAsync).toHaveBeenCalledWith(HREF, { presentationStyle: 'automatic' });
  });

  it('leaves the press alone on web, where the browser is already the browser', async () => {
    vi.stubEnv('EXPO_OS', 'web');

    const user = userEvent.setup();

    await render(<ExternalLink href={HREF}><Text>docs</Text></ExternalLink>);
    await user.press(screen.getByText('docs'));

    expect(openBrowserAsync).not.toHaveBeenCalled();
  });
});
