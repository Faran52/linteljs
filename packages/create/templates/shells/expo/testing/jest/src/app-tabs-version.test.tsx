import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { ANSWERS, STACK } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

import VersionScreen from './app/(tabs)/version';

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

  it('renders every answer this project was generated from, labelled in the language chosen', async () => {
    await renderScreen(<VersionScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];

    for (const { label } of ANSWERS) {
      const elements = screen.getAllByText(common[label]);
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

  it('is the one main landmark on the page, and a keyboard can reach its scroll', async () => {
    await renderScreen(<VersionScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toHaveProp('tabIndex', 0);
    // iOS offsets a padded scroll view's content in RTL, so the padding sits on its content.
    expect(landmarks[0]).not.toHaveStyle({ paddingHorizontal: 24 });
  });
});
