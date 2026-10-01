import { languages, languageStorageKey } from '@i18n/config';
import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';

import { LanguageSelect } from './LanguageSelect';

const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('offers every language under its own name', () => {
    render(<LanguageSelect />, { wrapper: I18nProvider });

    const options = screen.getAllByRole('option')
      .map((option) => {
        return option.textContent;
      });
    const labels = languages
      .map(({ label }) => {
        return label;
      });

    expect(options).toEqual(labels);
  });

  it('switches the language, and stores the choice', () => {
    render(<LanguageSelect className="tab" />, { wrapper: I18nProvider });
    act(() => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
    });

    const select = screen.getByRole<HTMLSelectElement>('combobox');

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(select.value).toBe(last);
    expect(select.className).toBe('tab');
  });
});
