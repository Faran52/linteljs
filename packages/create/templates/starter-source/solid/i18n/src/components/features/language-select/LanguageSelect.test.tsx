import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { applyLanguage } from '../../../i18n';
import { languages, languageStorageKey } from '../../../i18n/config';

import { LanguageSelect } from './LanguageSelect';

const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

  it('offers every language, each named in itself', () => {
    render(() => {
      return <LanguageSelect />;
    });

    const options = screen.getAllByRole('option');
    const ids = languages
      .map((option) => {
        return option.id;
      });
    const values = options
      .map((option) => {
        return option.getAttribute('value');
      });
    const names = options
      .map((option) => {
        return option.textContent;
      });
    const labels = languages
      .map((option) => {
        return option.label;
      });
    const tags = options
      .map((option) => {
        return option.getAttribute('lang');
      });

    expect(values).toEqual(ids);
    expect(names).toEqual(labels);
    expect(tags).toEqual(ids);
  });

  it('shows the language applied, and stores a choice', () => {
    render(() => {
      return <LanguageSelect />;
    });

    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Language' });

    expect(select.value).toBe('en');

    fireEvent.change(select, { target: { value: last } });

    expect(select.value).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBe(last);
  });

  it('shows a language applied before it renders', () => {
    applyLanguage(last);

    render(() => {
      return <LanguageSelect />;
    });

    const select = screen.getByRole<HTMLSelectElement>('combobox');

    expect(select.value).toBe(last);
  });

  it('takes the style its header gives it', () => {
    render(() => {
      return <LanguageSelect class="tab" style={{ color: 'red' }} />;
    });

    const select = screen.getByRole('combobox');

    expect(select.getAttribute('class')).toBe('tab');
    expect(select.style.color).toBe('red');
  });
});
