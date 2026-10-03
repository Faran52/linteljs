import { tick } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { applyLanguage, directionOf } from '@i18n';
import { languages, languageStorageKey } from '@i18n/config';
import { storedLanguage } from '@i18n/utils/cookieUtils';

import LanguageSelect from './LanguageSelect.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
    applyLanguage('en');
  });

  it('offers every language under its own name', () => {
    render(LanguageSelect);

    const options = screen
      .getAllByRole('option')
      .map((option) => {
        return option.textContent;
      });
    const tags = screen
      .getAllByRole('option')
      .map((option) => {
        return option.getAttribute('lang');
      });
    const labels = languages
      .map(({ label }) => {
        return label;
      });
    const ids = languages
      .map(({ id }) => {
        return id;
      });

    expect(options).toEqual(labels);
    expect(tags).toEqual(ids);
    const element = screen.getByRole('combobox', { name: 'Language' });
    expect(element).toBeTruthy();
  });

  it('switches the language, and stores the choice', async () => {
    render(LanguageSelect, { class: 'tab' });

    const select: HTMLSelectElement = screen.getByRole('combobox');

    await fireEvent.change(select, { target: { value: last } });

    expect(select.value).toBe(last);
    expect(select.className).toBe('tab');
    const item = storedLanguage(document.cookie);
    expect(item).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('shows the language applied elsewhere', async () => {
    render(LanguageSelect);
    applyLanguage(last);
    await tick();

    const select: HTMLSelectElement = screen.getByRole('combobox');

    expect(select.value).toBe(last);
  });
});
