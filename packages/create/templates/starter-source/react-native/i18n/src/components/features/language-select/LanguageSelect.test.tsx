import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { languages, languageStorageKey } from '@/i18n/config';

import { LanguageSelect } from './LanguageSelect';

const last = languages.at(-1) ?? languages[0];

const open = async (): Promise<void> => {
  await renderScreen(<LanguageSelect />);
  await fireEvent.press(screen.getByRole('button', { name: 'Language' }));
};

describe('LanguageSelect', () => {
  afterEach(async () => {
    await AsyncStorage.clear();

    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('names the language in use, and lists none until opened', async () => {
    await renderScreen(<LanguageSelect />);

    const trigger = screen.getByRole('button', { name: 'Language' });

    expect(within(trigger).getByText('English')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('offers every language under its own name, the one in use checked', async () => {
    await open();

    const options = screen.getAllByRole('radio');
    const checked = screen.getByRole('radio', { checked: true });

    expect(options).toHaveLength(languages.length);

    for (const { label } of languages) {
      expect(screen.getByRole('radio', { name: label })).toBeTruthy();
    }

    expect(within(checked).getByText('English')).toBeTruthy();
  });

  it('switches the language, stores the choice and closes', async () => {
    await open();
    await fireEvent.press(screen.getByRole('radio', { name: last.label }));

    await waitFor(() => {
      expect(i18next.language).toBe(last.id);
    });

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(stored).toBe(last.id);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it.each(['press', 'requestClose'])('closes on %s outside a language, choosing nothing', async (event) => {
    await open();
    await fireEvent(screen.getByRole('radiogroup', { name: 'Language' }), event);

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(stored).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });
});
