import { initReactI18next } from 'react-i18next';

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  resources,
} from './config';

export const directionOf = (language: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === language;
    })?.dir ?? 'ltr';
};

export const applyDocumentDirection = (language: string): void => {
  const root = document.documentElement;

  root.lang = language;
  root.dir = directionOf(language);
};

// The one writer of the stored choice.
export const chooseLanguage = async (language: string): Promise<void> => {
  localStorage.setItem(languageStorageKey, language);
  await i18next.changeLanguage(language);
};

export const initI18n = (): typeof i18next => {
  if (!i18next.isInitialized) {
    void i18next
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: fallbackLanguage,
        supportedLngs: languages
          .map((option) => {
            return option.id;
          }),
        defaultNS: 'common',
        initAsync: false,
        interpolation: { escapeValue: false },
        detection: {
          order: ['localStorage', 'navigator'],
          // Nothing is stored on detection: a first visit would otherwise look like a choice.
          caches: [],
          lookupLocalStorage: languageStorageKey,
        },
      });

    applyDocumentDirection(i18next.language);
    i18next.on('languageChanged', applyDocumentDirection);
  }

  return i18next;
};
