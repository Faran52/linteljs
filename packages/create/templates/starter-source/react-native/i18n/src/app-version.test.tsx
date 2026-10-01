import { renderScreen } from '@mocks/renderScreen';
import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import VersionScreen from '@/app/version';
import { ANSWERS, STACK } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

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
      expect(screen.getAllByText(name)).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', async () => {
    await renderScreen(<VersionScreen />);

    for (const { label } of ANSWERS) {
      expect(screen.getAllByText(label)).not.toHaveLength(0);
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
      expect(screen.getByText(text)).toBeTruthy();
    }
  });
});
