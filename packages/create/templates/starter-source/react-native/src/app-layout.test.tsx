import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { StatusBar } from 'expo-status-bar';

import { MAX_FONT_SCALE } from '@/styles/starter';

import RootLayout from './app/_layout';

jest.mock('expo-status-bar', () => {
  const statusBar = jest.fn((): null => {
    return null;
  });
  const expoStatusBar = { StatusBar: statusBar };

  return expoStatusBar;
});

const empty = (): null => {
  return null;
};

const ROUTES = {
  '_layout': RootLayout,
  'index': empty,
  'about': empty,
  'version': empty,
  '+not-found': empty,
};

describe('the root layout', () => {
  afterEach(() => {
    // `renderRouter` turns fake timers on.
    jest.useRealTimers();
  });

  it('lets the status bar follow the scheme', async () => {
    await renderRouter(ROUTES);

    const statusBar = jest.mocked(StatusBar);
    const expected = { style: 'auto' };
    expect(statusBar).toHaveBeenCalledWith(expected, undefined);
  });

  // The header's height is fixed, so the largest system text would clip the title.
  it('caps how far the header title grows with the system text size', async () => {
    await renderRouter(ROUTES);

    const title = screen.getByRole('heading', { name: 'LintelJS Starter' });
    expect(title.props.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  });
});
