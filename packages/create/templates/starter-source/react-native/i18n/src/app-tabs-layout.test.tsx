import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import i18next from 'i18next';

import { languages, resources } from '@/i18n/config';
import { MAX_FONT_SCALE } from '@/styles/starter';

import TabsLayout from './app/(tabs)/_layout';

const empty = (): null => {
  return null;
};

const ROUTES = {
  _layout: TabsLayout,
  index: empty,
  about: empty,
  contact: empty,
  version: empty,
};

const last = languages.at(-1)?.id ?? 'en';

describe('the tabs layout', () => {
  afterEach(async () => {
    // `renderRouter` turns fake timers on.
    jest.useRealTimers();

    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  // The header's height is fixed, so the largest system text would clip the title.
  it('caps how far the header title grows with the system text size', async () => {
    await renderRouter(ROUTES);

    const title = screen.getByRole('heading', { name: 'LintelJS Starter' });
    expect(title.props.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  });

  // The navigator's own 16 would start the title short of the page below it.
  it('starts the header title on the screen\'s inset', async () => {
    await renderRouter(ROUTES);

    const container = screen.getByRole('heading', { name: 'LintelJS Starter' }).parent;
    expect(container).toHaveStyle({ marginStart: 24 });
  });

  it('puts the language select in the header', async () => {
    await renderRouter(ROUTES);

    const select = screen.getByRole('button', { name: 'Language' });
    expect(select).toBeTruthy();
  });

  it('titles the header in the language chosen', async () => {
    await renderRouter(ROUTES);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { name: common.starterLabel });
    expect(title).toBeTruthy();
  });
});
