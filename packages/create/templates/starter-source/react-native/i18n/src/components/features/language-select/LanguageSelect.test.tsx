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
import { MAX_FONT_SCALE } from '@/styles/starter';

import { LanguageSelect } from './LanguageSelect';

import type { TestInstance } from 'test-renderer';

const last = languages.at(-1) ?? languages[0];

// An accessible ancestor folds its children into one element, so a screen reader could not reach them.
const accessibleAncestorOf = (element: TestInstance): TestInstance | null => {
  let current = element.parent;

  while (current !== null && current.props.accessible !== true) {
    current = current.parent;
  }

  return current;
};

const menu = (): TestInstance | null => {
  const [option] = screen.getAllByRole('radio');

  return option?.parent ?? null;
};

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

    const element = within(trigger).getByText('English');
    expect(element).toBeTruthy();
    const elements = screen.queryAllByRole('radio');
    expect(elements).toHaveLength(0);
  });

  // A narrow header would otherwise break the label inside a word.
  it('keeps the label on one line', async () => {
    await renderScreen(<LanguageSelect />);

    const label = screen.getByText('English');
    expect(label.props.numberOfLines).toBe(1);
  });

  // The header's height is fixed, so the largest system text would clip the label.
  it('caps how far the label grows with the system text size', async () => {
    await renderScreen(<LanguageSelect />);

    const label = screen.getByText('English');
    expect(label.props.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  });

  it('offers every language under its own name, the one in use checked', async () => {
    await open();

    const options = screen.getAllByRole('radio');
    const checked = screen.getByRole('radio', { checked: true });

    expect(options).toHaveLength(languages.length);

    for (const { label } of languages) {
      const element = screen.getByRole('radio', { name: label });
      expect(element).toBeTruthy();
    }

    const element = within(checked).getByText('English');
    expect(element).toBeTruthy();
  });

  it('groups the languages under its name, each one reachable by a screen reader', async () => {
    await open();

    const group = menu();

    expect(group?.props.accessibilityRole).toBe('radiogroup');
    expect(group?.props.accessibilityLabel).toBe('Language');

    for (const option of screen.getAllByRole('radio')) {
      const ancestor = accessibleAncestorOf(option);
      expect(ancestor).toBeNull();
    }
  });

  it('switches the language, stores the choice and closes', async () => {
    await open();
    await fireEvent.press(screen.getByRole('radio', { name: last.label }));

    await waitFor(() => {
      expect(i18next.language).toBe(last.id);
    });

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(stored).toBe(last.id);
    const elements = screen.queryAllByRole('radio');
    expect(elements).toHaveLength(0);
  });

  it.each(['press', 'requestClose'])('closes on %s outside a language, choosing nothing', async (event) => {
    await open();
    const group = menu();

    if (group !== null) {
      await fireEvent(group, event);
    }

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(stored).toBeNull();
    const elements = screen.queryAllByRole('radio');
    expect(elements).toHaveLength(0);
  });
});
