import { languages, languageStorageKey } from './config';
import {
  applyDocumentDirection,
  chooseLanguage,
  detectLanguage,
  directionOf,
  subscribeLanguage,
} from './index';

const last = languages.at(-1)?.id ?? 'en';

const browserSpeaks = (tags: string[]): void => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(tags);
};

describe('i18n', () => {
  afterEach(() => {
    localStorage.clear();
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

  it('stores a choice and tells each listener, until it unsubscribes', () => {
    const heard: string[] = [];
    const unsubscribe = subscribeLanguage(() => {
      heard.push(detectLanguage());
    });

    chooseLanguage(last);
    unsubscribe();
    chooseLanguage('en');

    expect(heard).toEqual([last]);
    expect(localStorage.getItem(languageStorageKey)).toBe('en');
  });

  it('sets the document language and direction', () => {
    applyDocumentDirection(last);

    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      expect(directionOf(id)).toBe(dir);
    }

    expect(directionOf('xx')).toBe('ltr');
  });
});
