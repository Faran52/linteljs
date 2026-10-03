import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { CHECK, NAME } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

import HomeScreen from './app/index';

const last = languages.at(-1)?.id ?? 'en';

describe('the home screen', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('carries the project name and the mark', async () => {
    await renderScreen(<HomeScreen />);

    const element = screen.getByText(NAME);
    expect(element).toBeTruthy();
    const linteljsElement = screen.getByLabelText('linteljs');
    expect(linteljsElement).toBeTruthy();
  });

  it('names the one command that runs the whole gate', async () => {
    await renderScreen(<HomeScreen />);

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    await renderScreen(<HomeScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeExpo);
    expect(element).toBeTruthy();
  });
});
