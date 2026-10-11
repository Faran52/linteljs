import { TestBed } from '@angular/core/testing';

import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { applyLanguage, language } from '@i18n/i18n';

import { LanguageSelect } from './language-select';

const last = languages.at(-1)?.id ?? 'en';

const open = async (): Promise<HTMLSelectElement> => {
  const harness = TestBed.createComponent(LanguageSelect);

  await harness.whenStable();

  const root = harness.nativeElement as HTMLElement;
  const select = root.querySelector('select');

  if (select === null) {
    throw new Error('No language select');
  }

  return select;
};

describe('LanguageSelect', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

  it('offers every language, and shows the one applied', async () => {
    applyLanguage(last);

    const select = await open();
    const offered = [...select.querySelectorAll('option')]
      .map((option) => {
        const entry = {
          id: option.value,
          lang: option.lang,
          label: option.textContent.trim(),
        };

        return entry;
      });

    const expected = languages
      .map((option) => {
        const entry = {
          id: option.id,
          lang: option.id,
          label: option.label,
        };

        return entry;
      });

    const label = select.getAttribute('aria-label');

    expect(offered).toEqual(expected);
    expect(select.value).toBe(last);
    expect(label).toBe(resources[last].common.language);
  });

  it('stores and applies the language chosen', async () => {
    const select = await open();

    select.value = last;
    select.dispatchEvent(new Event('change'));

    const applied = language();
    const stored = localStorage.getItem(languageStorageKey);

    expect(applied).toBe(last);
    expect(stored).toBe(last);
  });
});
