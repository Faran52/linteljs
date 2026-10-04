import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18next from 'i18next';

import {
  fallbackLanguage,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';
import { directionOf, isLanguage } from './utils/languageUtils';

export { directionOf };

// The exact tag, then each shorter prefix: `zh-TW-XX` reads as `zh-TW`, `ja-JP` as `ja`.
export const matchLanguage = (tag: string | null): string | undefined => {
  const candidates = tag === null ? [] : lookupTags(tag);

  return candidates.find(isLanguage);
};

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

// The stored choice, then the device's language, then English; nothing detected is stored.
export const detectLanguage = async (): Promise<string> => {
  const storedTag = await AsyncStorage.getItem(languageStorageKey);
  const stored = matchLanguage(storedTag);

  return stored ?? matchLanguage(Intl.DateTimeFormat().resolvedOptions().locale) ?? fallbackLanguage;
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
