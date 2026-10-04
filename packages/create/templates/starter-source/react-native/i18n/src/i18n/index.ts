import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLocales } from 'expo-localization';
import i18next from 'i18next';

import {
  fallbackLanguage,
  languageStorageKey,
  resources,
} from './config';
import { directionOf, pickLanguage } from './utils/languageUtils';

export { directionOf };

// Native lays out its direction at launch, so a switch there shows from the next one on.
export const applyDirection = (language: string): void => {
  const rtl = directionOf(language) === 'rtl';

  if (Platform.OS === 'web') {
    document.documentElement.lang = language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';

    return;
  }

  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
};

// The one writer of the stored choice.
export const chooseLanguage = async (language: string): Promise<void> => {
  await AsyncStorage.setItem(languageStorageKey, language);
  await i18next.changeLanguage(language);
};

// The stored choice, then each language the device prefers, in its order, then English; nothing detected is stored.
// Not `Intl`: iOS resolves it against the app's own localizations, so a device in Arabic reads as `en-SA` in Expo Go.
export const detectLanguage = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(languageStorageKey);
  const preferred = getLocales()
    .map(({ languageTag }) => {
      return languageTag;
    });

  return pickLanguage(stored, preferred);
};

// After the first render: the web export is rendered in English, and hydration has to match it.
export const restoreLanguage = async (): Promise<void> => {
  const language = await detectLanguage();

  await i18next.changeLanguage(language);
};

export const initI18n = (): typeof i18next => {
  if (!i18next.isInitialized) {
    void i18next
      .use(initReactI18next)
      .init({
        resources,
        lng: fallbackLanguage,
        fallbackLng: fallbackLanguage,
        defaultNS: 'common',
        initAsync: false,
        // Single braces, the placeholder style the locale files use, not i18next's default double.
        interpolation: {
          escapeValue: false,
          prefix: '{',
          suffix: '}',
        },
      });

    i18next.on('languageChanged', applyDirection);
  }

  return i18next;
};
