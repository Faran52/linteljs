import { languages, languageStorageKey } from './config';
import {
  applyLanguage,
  chooseLanguage,
  detectLanguage,
  directionOf,
  i18n,
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

  it('falls back to English for a browser language it does not offer', () => {
    browserSpeaks(['fr-FR']);

    const language = detectLanguage();
    expect(language).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', () => {
    browserSpeaks(['fr-FR', last]);

    const language = detectLanguage();
    expect(language).toBe(last);
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBeNull();
  });

  it('reads a regional browser language as its own language', () => {
    browserSpeaks([`${base}-001`]);

    const language = detectLanguage();
    expect(language).toBe(base);
  });

  it('reads a longer browser tag as the longest one it offers', () => {
    browserSpeaks([`${last}-x-test`]);

    const language = detectLanguage();
    expect(language).toBe(last);
  });

  it('puts a stored choice before the browser, and ignores one it does not offer', () => {
    browserSpeaks(['fr-FR']);
    localStorage.setItem(languageStorageKey, last);

    const language = detectLanguage();
    expect(language).toBe(last);

    localStorage.setItem(languageStorageKey, 'xx');

    const language2 = detectLanguage();
    expect(language2).toBe('en');
  });

  it('stores a choice, and switches the text, language and direction', () => {
    chooseLanguage(last);

    const language = i18n.global.locale.value;

    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBe(last);
    expect(language).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('applies a language without storing it', () => {
    applyLanguage(last);

    const language = i18n.global.locale.value;

    expect(language).toBe(last);
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBeNull();
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      const direction = directionOf(id);
      expect(direction).toBe(dir);
    }

    const direction = directionOf('xx');
    expect(direction).toBe('ltr');
  });

  it('keeps an at sign as text', () => {
    const text = i18n.global.t('standardEslint');

    expect(text).toContain('@linteljs/eslint-config');
  });
});
