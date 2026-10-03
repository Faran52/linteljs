import { languages, languageStorageKey } from './config';
import {
  chooseLanguage,
  detectLanguage,
  directionOf,
  initI18n,
} from './index';
import { languageCookie, storedLanguage } from './utils/cookieUtils';

const last = languages.at(-1)?.id ?? 'en';

// With no language named, i18next detects again, exactly as it does at init.
const detected = async (): Promise<string> => {
  const i18n = initI18n();

  await i18n.changeLanguage();

  return i18n.language;
};

const browserSpeaks = (tags: string[]): void => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(tags);
};

describe('i18n', () => {
  afterEach(async () => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
    vi.restoreAllMocks();
    await initI18n().changeLanguage('en');
  });

  it('falls back to English for a browser language it does not offer', async () => {
    browserSpeaks(['fr-FR']);

    const actual = await detected();
    expect(actual).toBe('en');
  });

  it('follows the browser, and stores nothing it detected', async () => {
    browserSpeaks([last]);

    const actual = await detected();
    expect(actual).toBe(last);
    const item = storedLanguage(document.cookie);
    expect(item).toBeUndefined();
  });

  it('puts a stored choice before the browser', async () => {
    browserSpeaks(['fr-FR']);
    document.cookie = languageCookie(last);

    const actual = await detected();
    expect(actual).toBe(last);
  });

  it('initialises once', () => {
    const actual = initI18n();
    expect(actual).toBe(initI18n());
  });

  it('stores a choice and sets the document language and direction', async () => {
    initI18n();
    await chooseLanguage(last);

    const item = storedLanguage(document.cookie);
    expect(item).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
  });

  it('detects a request\'s stored choice before the languages it accepts', () => {
    const actual = detectLanguage(`theme=dark; ${languageCookie(last)}`, ['en']);
    expect(actual).toBe(last);
  });

  it('detects a request\'s accepted language when nothing is stored, and English when none is offered', () => {
    const accepted = detectLanguage('', ['fr', last]);
    expect(accepted).toBe(last);

    const unoffered = detectLanguage(languageCookie('xx'), ['fr']);
    expect(unoffered).toBe('en');
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      const direction = directionOf(id);
      expect(direction).toBe(dir);
    }

    const direction = directionOf('xx');
    expect(direction).toBe('ltr');
  });
});
