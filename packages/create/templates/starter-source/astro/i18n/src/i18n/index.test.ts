import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';
import {
  applyLanguage,
  bootLanguage,
  bootScript,
  chooseLanguage,
  directionOf,
  partsOf,
  startLanguage,
  t,
  translateId,
} from './index';
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

const boot = (): string => {
  bootLanguage(languages, languageStorageKey, fallbackLanguage, lookupTags);

  return document.documentElement.lang;
};

const PAGE = `
  <title data-i18n="about">About</title>
  <p data-i18n="aboutSync" data-command="npx @linteljs/create sync">old</p>
  <p data-i18n="notAKey">kept</p>
  <select data-language>
    ${languages
      .map(({ id }) => {
        return `<option value="${id}">${id}</option>`;
      })
      .join('')}
  </select>
`;

const marked = (selector: string): Element | null => {
  return document.querySelector(selector);
};

const pickerOf = (): HTMLSelectElement => {
  const picker = marked('select');

  if (!(picker instanceof HTMLSelectElement)) {
    throw new TypeError('The page has no language select');
  }

  return picker;
};

describe('i18n', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
  });

  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
    document.cookie = 'other=; max-age=-1; path=/';
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('falls back to English for a browser language it does not offer', () => {
    browserSpeaks(['fr-FR']);

    const actual = boot();
    expect(actual).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', () => {
    browserSpeaks(['fr-FR', last]);

    const actual = boot();
    expect(actual).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
  });

  it('reads a regional browser language as its own language', () => {
    browserSpeaks([`${base}-001`]);

    const actual = boot();
    expect(actual).toBe(base);
  });

  it('reads a longer browser tag as the longest one it offers', () => {
    browserSpeaks([`${last}-x-test`]);

    const actual = boot();
    expect(actual).toBe(last);
  });

  it('reads a full browser tag it offers before its base language, and boots right to left', () => {
    browserSpeaks(['ar-EG']);
    bootLanguage([{ id: 'en', dir: 'ltr' }, { id: 'ar-EG', dir: 'rtl' }], languageStorageKey, 'en', lookupTags);

    expect(document.documentElement.lang).toBe('ar-EG');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('puts a stored choice before the browser, and ignores one it does not offer', () => {
    browserSpeaks(['fr-FR']);
    document.cookie = 'other=1; path=/';
    document.cookie = languageCookie(last);

    const actual = boot();
    expect(actual).toBe(last);

    document.cookie = languageCookie('xx');

    const actual2 = boot();
    expect(actual2).toBe('en');
  });

  it('boots left to right into a fallback it does not offer', () => {
    bootLanguage([], languageStorageKey, 'xx', lookupTags);

    expect(document.documentElement.lang).toBe('xx');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('inlines the boot function, called with the config the module reads', () => {
    const script = bootScript();

    const args = [
      languages,
      languageStorageKey,
      fallbackLanguage,
    ]
      .map((arg) => {
        return JSON.stringify(arg);
      });
    const call = [...args, lookupTags.toString()].join(', ');

    expect(script).toBe(`(${bootLanguage.toString()})(${call});`);
  });

  it('stores a choice, and switches the text, language, direction and select', () => {
    document.documentElement.dir = 'auto';
    chooseLanguage(last);

    const title = marked('title')?.textContent;
    const picker = pickerOf();

    const item = storedLanguage(document.cookie);
    expect(item).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
    expect(title).toBe(resources[last].common.about);
    expect(picker.value).toBe(last);
    const attribute = picker.getAttribute('aria-label');
    expect(attribute).toBe(resources[last].common.language);
  });

  it('switches a page that has no select', () => {
    document.body.innerHTML = '<p data-i18n="home">Home</p>';
    applyLanguage(last);

    const home = marked('p')?.textContent;

    expect(home).toBe(resources[last].common.home);
  });

  it('ignores a choice it does not offer', () => {
    chooseLanguage('xx');

    expect(document.documentElement.lang).toBe('en');
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
  });

  it('fills a value from the element, and renders a marked command as code', () => {
    applyLanguage(last);

    const code = marked('[data-command] code')?.textContent;

    expect(code).toBe('npx @linteljs/create sync');
  });

  it('leaves an element whose key no locale names', () => {
    applyLanguage(last);

    const kept = marked('[data-i18n="notAKey"]')?.textContent;

    expect(kept).toBe('kept');
  });

  it('starts in the language on the root, and switches when the select changes', () => {
    document.documentElement.lang = last;
    startLanguage();

    const picker = pickerOf();

    expect(picker.value).toBe(last);

    picker.value = 'en';
    picker.dispatchEvent(new Event('change'));

    const item = storedLanguage(document.cookie);
    expect(item).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('starts in English when the root names no language it offers', () => {
    document.documentElement.lang = 'xx';
    startLanguage();

    expect(document.documentElement.lang).toBe('en');
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      const direction = directionOf(id);
      expect(direction).toBe(dir);
    }

    const direction = directionOf('xx');
    expect(direction).toBe('ltr');
  });

  it('renders English by default, and the language it is given', () => {
    const english = t('home');
    const other = t('home', undefined, last);

    expect(english).toBe(resources.en.common.home);
    expect(other).toBe(resources[last].common.home);
  });

  it('fills every value a message names, and leaves one it was not given', () => {
    const filled = t('versionRecorded', {
      file: 'linteljs.config.json',
      command: 'sync',
    });
    const unfilled = t('aboutSync');

    expect(filled).toContain('<code>linteljs.config.json</code>');
    expect(filled).toContain('<code>sync</code>');
    expect(unfilled).toContain('{command}');
  });

  it('splits a message so its odd parts are code', () => {
    const parts = partsOf('Run <code>pnpm check</code> now');

    const expected = [
      'Run ',
      'pnpm check',
      ' now',
    ];
    expect(parts).toEqual(expected);
  });

  it('translates a page id that is a key, and shows any other as the id', () => {
    const home = translateId('home');
    const other = translateId('elsewhere');

    expect(home).toBe(resources.en.common.home);
    expect(other).toBe('elsewhere');
  });
});
