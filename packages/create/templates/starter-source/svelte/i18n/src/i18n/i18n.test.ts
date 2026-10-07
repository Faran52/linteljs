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
} from './i18n';
import { languageCookie, storedLanguage } from './utils/cookieUtils';

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
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('starts in English, whatever the browser speaks', () => {
    const language = get(locale);

    expect(language).toBe('en');
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
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
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
    document.cookie = languageCookie(last);

    const language = detectLanguage();
    expect(language).toBe(last);

    document.cookie = languageCookie('xx');

    const language2 = detectLanguage();
    expect(language2).toBe('en');
  });

  it('reads a request cookie and languages in place of the browser', () => {
    browserSpeaks(['fr-FR']);
    const cookies = languageCookie(base);

    const language = detectLanguage(cookies, []);
    expect(language).toBe(base);

    const language2 = detectLanguage('', [last]);
    expect(language2).toBe(last);
  });

  it('stores a choice, and switches the text, language and direction', () => {
    chooseLanguage(last);

    const language = get(locale);

    const item = storedLanguage(document.cookie);
    expect(item).toBe(last);
    expect(language).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('ignores a choice it does not offer', () => {
    chooseLanguage('xx');

    const language = get(locale);

    expect(language).toBe('en');
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
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
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      const direction = directionOf(id);
      expect(direction).toBe(dir);
    }

    const direction = directionOf('xx');
    expect(direction).toBe('ltr');
  });

  it('keeps a marked command and an at sign as text', () => {
    const text = m.aboutSync({ command: 'npx @linteljs/create sync' });

    expect(text).toContain('<code>npx @linteljs/create sync</code>');
  });
});
