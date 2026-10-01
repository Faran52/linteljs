import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { initI18n } from '@i18n';
import { languages, languageStorageKey } from '@i18n/config';

import { LanguageSelect } from './LanguageSelect';

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(async () => {
    localStorage.clear();

    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('offers every language under its own name', () => {
    render(<LanguageSelect />);

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

  it('switches the language, and stores the choice', async () => {
    render(<LanguageSelect className="tab" />);

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
      await i18n.changeLanguage(last);
    });

    const select = screen.getByRole<HTMLSelectElement>('combobox');

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(i18n.language).toBe(last);
    expect(select.value).toBe(last);
    expect(select.className).toBe('tab');
  });
});
