import { mount } from '@vue/test-utils';

import { applyLanguage, directionOf } from '../../../i18n';
import { languages, languageStorageKey } from '../../../i18n/config';

import LanguageSelect from './LanguageSelect.vue';

const last = languages.at(-1)?.id ?? 'en';

describe('LanguageSelect', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

  it('offers every language under its own name', () => {
    const select = mount(LanguageSelect);

    const options = select
      .findAll('option')
      .map((option) => {
        return option.text();
      });
    const labels = languages
      .map(({ label }) => {
        return label;
      });

    expect(options).toEqual(labels);
    expect(select.attributes('aria-label')).toBe('Language');
  });

  it('switches the language, and stores the choice', async () => {
    const select = mount(LanguageSelect);

    await select
      .find('select')
      .setValue(last);

    const chosen = select
      .find('select')
      .element
      .value;

    expect(chosen).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });
});
