import { languages, languageStorageKey } from './config';
import {
  chooseLanguage,
  directionOf,
  initI18n,
} from './index';

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
    localStorage.clear();
    vi.restoreAllMocks();
    await initI18n().changeLanguage('en');
  });

  it('falls back to English for a browser language it does not offer', async () => {
    browserSpeaks(['fr-FR']);

    await expect(detected()).resolves.toBe('en');
  });

  it('follows the browser, and stores nothing it detected', async () => {
    browserSpeaks([last]);

    await expect(detected()).resolves.toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it('puts a stored choice before the browser', async () => {
    browserSpeaks(['fr-FR']);
    localStorage.setItem(languageStorageKey, last);

    await expect(detected()).resolves.toBe(last);
  });

  it('initialises once', () => {
    expect(initI18n()).toBe(initI18n());
  });

  it('stores a choice and sets the document language and direction', async () => {
    initI18n();
    await chooseLanguage(last);

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
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
