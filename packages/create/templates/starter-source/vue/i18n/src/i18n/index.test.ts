import { languages, languageStorageKey } from './config';
import {
  applyLanguage,
  chooseLanguage,
  detectLanguage,
  directionOf,
  i18n,
} from './index';

const last = languages.at(-1)?.id ?? 'en';

const browserSpeaks = (tags: string[]): void => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(tags);
};

describe('i18n', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
    vi.restoreAllMocks();
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
    browserSpeaks([`${last}-001`]);

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

    const language = i18n.global.locale.value;

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(language).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('applies a language without storing it', () => {
    applyLanguage(last);

    const language = i18n.global.locale.value;

    expect(language).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      expect(directionOf(id)).toBe(dir);
    }

    expect(directionOf('xx')).toBe('ltr');
  });

  it('keeps an at sign as text', () => {
    const text = i18n.global.t('standardEslint');

    expect(text).toContain('@linteljs/eslint-config');
  });
});
