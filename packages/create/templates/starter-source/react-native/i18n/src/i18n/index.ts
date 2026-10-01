import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18next from 'i18next';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';

export const directionOf = (language: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === language;
    })?.dir ?? 'ltr';
};

// The exact tag, then each shorter prefix: `zh-TW-XX` reads as `zh-TW`, `ja-JP` as `ja`.
export const matchLanguage = (tag: string | null): string | undefined => {
  const ids: readonly string[] = languages
    .map((option) => {
      return option.id;
    });
  const candidates = tag === null ? [] : lookupTags(tag);

  return candidates
    .find((candidate) => {
      return ids.includes(candidate);
    });
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
  const stored = matchLanguage(await AsyncStorage.getItem(languageStorageKey));

  return stored ?? matchLanguage(Intl.DateTimeFormat().resolvedOptions().locale) ?? fallbackLanguage;
};

// After the first render: the web export is rendered in English, and hydration has to match it.
export const restoreLanguage = async (): Promise<void> => {
  await i18next.changeLanguage(await detectLanguage());
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
        // Single braces, as every other target's library reads the same locales.
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
