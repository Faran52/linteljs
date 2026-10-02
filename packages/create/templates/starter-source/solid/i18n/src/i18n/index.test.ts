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
  language,
  t,
  translateId,
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
    const actual = language();
    expect(actual).toBe('en');
  });

  it('falls back to English for a browser language it does not offer', () => {
    browserSpeaks(['fr-FR']);

    const language2 = detectLanguage();
    expect(language2).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', () => {
    browserSpeaks(['fr-FR', last]);

    const language2 = detectLanguage();
    expect(language2).toBe(last);
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBeNull();
  });

  it('reads a regional browser language as its own language', () => {
    browserSpeaks([`${base}-001`]);

    const language2 = detectLanguage();
    expect(language2).toBe(base);
  });

  it('reads a longer browser tag as the longest one it offers', () => {
    browserSpeaks([`${last}-x-test`]);

    const language2 = detectLanguage();
    expect(language2).toBe(last);
  });

  it('puts a stored choice before the browser, and ignores one it does not offer', () => {
    browserSpeaks(['fr-FR']);
    localStorage.setItem(languageStorageKey, last);

    const language2 = detectLanguage();
    expect(language2).toBe(last);

    localStorage.setItem(languageStorageKey, 'xx');

    const language3 = detectLanguage();
    expect(language3).toBe('en');
  });

  it('stores a choice, and switches the text, language and direction', () => {
    chooseLanguage(last);

    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBe(last);
    const actual = language();
    expect(actual).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('ignores a choice it does not offer', () => {
    chooseLanguage('xx');

    const actual = language();
    expect(actual).toBe('en');
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBeNull();
  });

  it('renders each message in the language applied', () => {
    applyLanguage(last);

    const text = t('home');

    expect(text).toBe(resources[last].common.home);
  });

  it('applies a language without storing it', () => {
    applyLanguage(last);

    const actual = language();
    expect(actual).toBe(last);
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

  it('fills a single-brace value, and keeps a marked command and an at sign as text', () => {
    const text = t('aboutSync', { command: 'npx @linteljs/create sync' });

    expect(text).toContain('<code>npx @linteljs/create sync</code>');
  });

  it('leaves a value it was not given in place', () => {
    const text = t('aboutSync');

    expect(text).toContain('<code>{command}</code>');
  });

  it('names a page by its id, and shows an id no locale names as itself', () => {
    applyLanguage(last);

    const translatedId = translateId('home');
    expect(translatedId).toBe(resources[last].common.home);
    const nowhereTranslatedId = translateId('nowhere');
    expect(nowhereTranslatedId).toBe('nowhere');
  });
});
