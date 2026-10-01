import { get } from 'svelte/store';

import {
  languages,
  languageStorageKey,
  resources,
} from './config';
import {
  applyLanguage,
  chooseLanguage,
  detectLanguage,
  directionOf,
  locale,
  m,
} from './index';

const last = languages.at(-1)?.id ?? 'en';
// A region on a regional tag such as zh-TW makes no tag, so the regional case takes a base one.
const base = languages
  .findLast(({ id }) => {
    return !id.includes('-');
  })?.id ?? 'en';

const browserSpeaks = (tags: string[]): void => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(tags);
};

describe('i18n', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('starts in English, whatever the browser speaks', () => {
    const language = get(locale);

    expect(language).toBe('en');
  });

  it('falls back to English for a browser language it does not offer', () => {
    browserSpeaks(['fr-FR']);

    expect(detectLanguage()).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', () => {
    browserSpeaks(['fr-FR', last]);

    expect(detectLanguage()).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it('reads a regional browser language as its own language', () => {
    browserSpeaks([`${base}-001`]);

    expect(detectLanguage()).toBe(base);
  });

  it('reads a longer browser tag as the longest one it offers', () => {
    browserSpeaks([`${last}-x-test`]);

    expect(detectLanguage()).toBe(last);
  });

  it('puts a stored choice before the browser, and ignores one it does not offer', () => {
    browserSpeaks(['fr-FR']);
    localStorage.setItem(languageStorageKey, last);

    expect(detectLanguage()).toBe(last);

    localStorage.setItem(languageStorageKey, 'xx');

    expect(detectLanguage()).toBe('en');
  });

  it('stores a choice, and switches the text, language and direction', () => {
    chooseLanguage(last);

    const language = get(locale);

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(language).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('ignores a choice it does not offer', () => {
    chooseLanguage('xx');

    const language = get(locale);

    expect(language).toBe('en');
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it('renders each message in the language applied', () => {
    applyLanguage(last);

    const text = m.home();

    expect(text).toBe(resources[last].common.home);
  });

  it('applies a language without storing it', () => {
    applyLanguage(last);

    const language = get(locale);

    expect(language).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      expect(directionOf(id)).toBe(dir);
    }

    expect(directionOf('xx')).toBe('ltr');
  });

  it('keeps a marked command and an at sign as text', () => {
    const text = m.aboutSync({ command: 'npx @linteljs/create sync' });

    expect(text).toContain('<code>npx @linteljs/create sync</code>');
  });
});
