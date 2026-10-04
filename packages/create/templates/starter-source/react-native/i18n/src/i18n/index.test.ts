import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLocales, type Locale } from 'expo-localization';
import i18next from 'i18next';

import { languages, languageStorageKey } from './config';
import {
  applyDirection,
  chooseLanguage,
  detectLanguage,
  directionOf,
  initI18n,
  restoreLanguage,
} from './index';

const last = languages.at(-1)?.id ?? 'en';

const localeOf = (languageTag: string): Locale => {
  const locale: Locale = {
    languageTag,
    languageCode: null,
    languageScriptCode: null,
    regionCode: null,
    languageRegionCode: null,
    currencyCode: null,
    currencySymbol: null,
    languageCurrencyCode: null,
    languageCurrencySymbol: null,
    decimalSeparator: null,
    digitGroupingSeparator: null,
    textDirection: 'ltr',
    measurementSystem: null,
    temperatureUnit: null,
  };

  return locale;
};

// The device's preferred languages, most preferred first, for the next read.
const devicePrefers = (first: string, ...rest: string[]): void => {
  const locales: [Locale, ...Locale[]] = [localeOf(first), ...rest.map(localeOf)];

  jest.mocked(getLocales).mockReturnValueOnce(locales);
};

describe('i18n', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
    // Jest's native environment has no `document`; the web branch reads one.
    Reflect.deleteProperty(globalThis, 'document');
    await i18next.changeLanguage('en');
  });

  it('follows the first language the device prefers that it offers, with or without a region', async () => {
    devicePrefers('fr-FR', `${last}-SA`, 'en-SA');

    const language = await detectLanguage();
    expect(language).toBe(last);
  });

  it('falls back to English for a device language it does not offer', async () => {
    devicePrefers('fr-FR');

    const language = await detectLanguage();
    expect(language).toBe('en');
  });

  it('follows the device, and stores nothing it detected', async () => {
    devicePrefers(last);
    await restoreLanguage();

    const stored = await AsyncStorage.getItem(languageStorageKey);

    expect(i18next.language).toBe(last);
    expect(stored).toBeNull();
  });

  it('puts a stored choice before the device', async () => {
    devicePrefers('fr-FR');
    await AsyncStorage.setItem(languageStorageKey, last);

    const language = await detectLanguage();
    expect(language).toBe(last);
  });

  it('initialises once, in English, so the first render matches the web export', () => {
    const init = jest.spyOn(i18next, 'init');
    const i18n = initI18n();

    const actual = initI18n();
    expect(actual).toBe(i18n);
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

  it('leaves the native direction to the device, which app.json lets lay out right to left', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL');
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL');

    for (const { id } of languages) {
      applyDirection(id);
    }

    expect(forceRTL).not.toHaveBeenCalled();
    expect(allowRTL).not.toHaveBeenCalled();
  });

  it('sets the document language and direction on the web', () => {
    const documentElement = { lang: '', dir: '' };

    const forceRTL = jest.spyOn(I18nManager, 'forceRTL');

    jest.replaceProperty(Platform, 'OS', 'web');
    Object.assign(globalThis, { document: { documentElement } });

    for (const { id, dir } of languages) {
      applyDirection(id);

      const expected = { lang: id, dir };
      expect(documentElement).toEqual(expected);
    }

    expect(forceRTL).not.toHaveBeenCalled();
  });

  it('applies the direction on every switch', async () => {
    const documentElement = { lang: '', dir: '' };

    jest.replaceProperty(Platform, 'OS', 'web');
    Object.assign(globalThis, { document: { documentElement } });

    await i18next.changeLanguage(last);

    const expected = { lang: last, dir: directionOf(last) };
    expect(documentElement).toEqual(expected);
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
