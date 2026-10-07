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
} from './i18n';

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
    const applied = language();

    expect(applied).toBe('en');
  });

  it('falls back to English for a browser language it does not offer', () => {
    browserSpeaks(['fr-FR']);

    const detected = detectLanguage();

    expect(detected).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', () => {
    browserSpeaks(['fr-FR', last]);

    const detected = detectLanguage();
    const stored = localStorage.getItem(languageStorageKey);

    expect(detected).toBe(last);
    expect(stored).toBeNull();
  });

  it('reads a regional browser language as its own language', () => {
    browserSpeaks([`${base}-001`]);

    const detected = detectLanguage();

    expect(detected).toBe(base);
  });

  it('reads a longer browser tag as the longest one it offers', () => {
    browserSpeaks([`${last}-x-test`]);

    const detected = detectLanguage();

    expect(detected).toBe(last);
  });

  it('puts a stored choice before the browser, and ignores one it does not offer', () => {
    browserSpeaks(['fr-FR']);
    localStorage.setItem(languageStorageKey, last);

    const fromStored = detectLanguage();

    expect(fromStored).toBe(last);

    localStorage.setItem(languageStorageKey, 'xx');

    const fromUnoffered = detectLanguage();

    expect(fromUnoffered).toBe('en');
  });

  it('stores a choice, and switches the text, language and direction', () => {
    chooseLanguage(last);

    const stored = localStorage.getItem(languageStorageKey);
    const applied = language();

    expect(stored).toBe(last);
    expect(applied).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('ignores a choice it does not offer', () => {
    chooseLanguage('xx');

    const applied = language();
    const stored = localStorage.getItem(languageStorageKey);

    expect(applied).toBe('en');
    expect(stored).toBeNull();
  });

  it('renders each message in the language applied', () => {
    applyLanguage(last);

    const text = t('home');

    expect(text).toBe(resources[last].common.home);
  });

  it('applies a language without storing it', () => {
    applyLanguage(last);

    const applied = language();
    const stored = localStorage.getItem(languageStorageKey);

    expect(applied).toBe(last);
    expect(stored).toBeNull();
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      const direction = directionOf(id);

      expect(direction).toBe(dir);
    }

    const fallback = directionOf('xx');

    expect(fallback).toBe('ltr');
  });

  it('fills a single-brace value, and keeps a marked command and an at sign as text', () => {
    const text = t('aboutSync', { command: 'npx @linteljs/create sync' });

    expect(text).toContain('<code>npx @linteljs/create sync</code>');
  });

  it('fills every value a message names', () => {
    const text = t('versionRecorded', {
      file: 'linteljs.config.json',
      command: 'sync',
    });

    expect(text).toContain('<code>linteljs.config.json</code>');
    expect(text).toContain('<code>sync</code>');
  });

  it('leaves a value it was not given in place', () => {
    const text = t('aboutSync');

    expect(text).toContain('<code>{command}</code>');
  });

  it('names a page by its id, and shows an id no locale names as itself', () => {
    applyLanguage(last);

    const named = translateId('home');
    const unnamed = translateId('nowhere');

    expect(named).toBe(resources[last].common.home);
    expect(unnamed).toBe('nowhere');
  });
});
