import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { ANSWERS, STACK } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

import VersionScreen from './app/version';

const last = languages.at(-1)?.id ?? 'en';

describe('the version screen', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('renders every recorded row of the stack', async () => {
    await renderScreen(<VersionScreen />);

    for (const { name } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', async () => {
    await renderScreen(<VersionScreen />);

    for (const { label } of ANSWERS) {
      const elements = screen.getAllByText(label);
      expect(elements).not.toHaveLength(0);
    }
  });

  it('speaks the language chosen', async () => {
    await renderScreen(<VersionScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];

    const shown = [
      common.version,
      common.versionLede,
      common.versionStack,
      common.versionAnswers,
    ];

    for (const text of shown) {
      const element = screen.getByText(text);
      expect(element).toBeTruthy();
    }
  });
});
