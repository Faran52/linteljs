import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { StatusBar } from 'expo-status-bar';

import { PAGES } from '@/config/routes';

import RootLayout from './app/_layout';
import TabsLayout from './app/(tabs)/_layout';

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

// expo-router puts every route file under a navigator, so the suite has exactly the project's pages.
const tabRoutes = PAGES
  .map((page) => {
    const name = page.id === 'home' ? 'index' : page.id;
    const route = [`(tabs)/${name}`, empty] as const;

    return route;
  });

const ROUTES = {
  '_layout': RootLayout,
  '(tabs)/_layout': TabsLayout,
  ...Object.fromEntries(tabRoutes),
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

  // VoiceOver reads each tab's position out of the navigator's routes, so the 404 must not be one of them.
  it('counts only the pages in each tab\'s position', async () => {
    await renderRouter(ROUTES);

    const label = `Home, tab, 1 of ${String(PAGES.length)}`;
    const tab = screen.getByLabelText(label);
    expect(tab).toBeTruthy();
  });
});
