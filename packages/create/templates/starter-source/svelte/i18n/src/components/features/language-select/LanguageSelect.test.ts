import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { applyLanguage, directionOf } from '../../../i18n';
import { languages, languageStorageKey } from '../../../i18n/config';

import LanguageSelect from './LanguageSelect.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

  it('offers every language under its own name', () => {
    render(LanguageSelect);

    const options = screen
      .getAllByRole('option')
      .map((option) => {
        return option.textContent;
      });
    const labels = languages
      .map(({ label }) => {
        return label;
      });

    expect(options).toEqual(labels);
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeTruthy();
  });

  it('switches the language, and stores the choice', async () => {
    render(LanguageSelect, { class: 'tab' });

    const select: HTMLSelectElement = screen.getByRole('combobox');

    await fireEvent.change(select, { target: { value: last } });

    expect(select.value).toBe(last);
    expect(select.className).toBe('tab');
    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });
});
