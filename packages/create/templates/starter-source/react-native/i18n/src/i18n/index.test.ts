import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18next from 'i18next';

import { languages, languageStorageKey } from './config';
import {
  applyDirection,
  chooseLanguage,
  detectLanguage,
  directionOf,
  initI18n,
  matchLanguage,
  restoreLanguage,
} from './index';

const last = languages.at(-1)?.id ?? 'en';

const deviceSpeaks = (locale: string): void => {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    ...new Intl.DateTimeFormat().resolvedOptions(),
    locale,
  });
};

describe('i18n', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await i18next.changeLanguage('en');
  });

  it('matches the exact tag, then its base language, and nothing it does not offer', () => {
    expect(matchLanguage(last)).toBe(last);
    expect(matchLanguage(`${last}-XX`)).toBe(last);
    expect(matchLanguage('en-GB')).toBe('en');
    expect(matchLanguage('fr-FR')).toBeUndefined();
    expect(matchLanguage(null)).toBeUndefined();
  });

  it('falls back to English for a device language it does not offer', async () => {
    deviceSpeaks('fr-FR');

    await expect(detectLanguage()).resolves.toBe('en');
  });

  it('follows the device, and stores nothing it detected', async () => {
    deviceSpeaks(last);
    await restoreLanguage();

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(i18next.language).toBe(last);
    expect(stored).toBeNull();
  });

  it('puts a stored choice before the device', async () => {
    deviceSpeaks('fr-FR');
    await AsyncStorage.setItem(languageStorageKey, last);

    await expect(detectLanguage()).resolves.toBe(last);
  });

  it('initialises once, in English, so the first render matches the web export', () => {
    const init = vi.spyOn(i18next, 'init');
    const i18n = initI18n();

    expect(initI18n()).toBe(i18n);
    expect(init).not.toHaveBeenCalled();
    expect(i18n.options.lng).toBe('en');
  });

  it('fills single braces and leaves the value unescaped, as the shared locales are written', () => {
    const command = '<a & b>';
    const filled = i18next.t('aboutCheck', { command });

    expect(filled).toContain(command);
    expect(filled).not.toContain('{command}');
  });

  it('stores a choice and switches to it', async () => {
    await chooseLanguage(last);

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(stored).toBe(last);
    expect(i18next.language).toBe(last);
  });

  it('asks native for each language direction, which it lays out from the next launch', () => {
    const forceRTL = vi.spyOn(I18nManager, 'forceRTL');
    const allowRTL = vi.spyOn(I18nManager, 'allowRTL');

    for (const { id, dir } of languages) {
      applyDirection(id);

      expect(forceRTL).toHaveBeenLastCalledWith(dir === 'rtl');
      expect(allowRTL).toHaveBeenLastCalledWith(dir === 'rtl');
    }
  });

  it('sets the document language and direction on the web', () => {
    const documentElement = { lang: '', dir: '' };

    const forceRTL = vi.spyOn(I18nManager, 'forceRTL');

    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    vi.stubGlobal('document', { documentElement });

    for (const { id, dir } of languages) {
      applyDirection(id);

      expect(documentElement).toEqual({ lang: id, dir });
    }

    expect(forceRTL).not.toHaveBeenCalled();
  });

  it('applies the direction on every switch', async () => {
    const forceRTL = vi.spyOn(I18nManager, 'forceRTL');

    await i18next.changeLanguage(last);

    expect(forceRTL).toHaveBeenLastCalledWith(directionOf(last) === 'rtl');
  });

  it('reads each language direction from the config, and left to right for any other', () => {
    for (const { id, dir } of languages) {
      expect(directionOf(id)).toBe(dir);
    }

    expect(directionOf('xx')).toBe('ltr');
  });
});
