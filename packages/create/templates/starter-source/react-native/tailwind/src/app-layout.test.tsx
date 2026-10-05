import { renderRouter } from 'expo-router/testing-library';
import { StatusBar } from 'expo-status-bar';

import RootLayout from './app/_layout';

// NativeWind's stylesheet means something to Metro only.
jest.mock('./global.css', () => {
  return {};
});

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
});
