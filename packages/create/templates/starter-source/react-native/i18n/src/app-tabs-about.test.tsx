import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { GATE } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

import AboutScreen from './app/(tabs)/about';

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
      const element = screen.getByText(command);
      expect(element).toBeTruthy();
    }
  });

  it('says where the standard lives', async () => {
    await renderScreen(<AboutScreen />);

    const element = screen.getByText('eslint.config.ts');
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    await renderScreen(<AboutScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];

    const shown = [
      common.about,
      common.aboutLede,
      common.aboutGate,
      common.aboutStandard,
      common.standardEslint,
    ];

    for (const text of shown) {
      const element = screen.getByText(text);
      expect(element).toBeTruthy();
    }
  });

  it('is the one main landmark on the page, and a keyboard can reach its scroll', async () => {
    await renderScreen(<AboutScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toHaveProp('tabIndex', 0);
  });
});
