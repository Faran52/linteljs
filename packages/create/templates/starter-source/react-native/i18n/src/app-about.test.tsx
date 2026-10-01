import { renderScreen } from '@mocks/renderScreen';
import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import AboutScreen from '@/app/about';
import { GATE } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

const last = languages.at(-1)?.id ?? 'en';

describe('the about screen', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('lists every leg of the gate', async () => {
    await renderScreen(<AboutScreen />);

    for (const { command } of GATE) {
      expect(screen.getByText(command)).toBeTruthy();
    }
  });

  it('says where the standard lives', async () => {
    await renderScreen(<AboutScreen />);

    expect(screen.getByText('eslint.config.js')).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    await renderScreen(<AboutScreen />);
    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];

    expect(screen.getByText(common.aboutGate)).toBeTruthy();
    expect(screen.getByText(common.standardEslint)).toBeTruthy();
  });
});
