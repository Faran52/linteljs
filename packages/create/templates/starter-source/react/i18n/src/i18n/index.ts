import { initReactI18next } from 'react-i18next';

import i18next, { type InitOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  resources,
} from './config';
import { languageCookie, storedLanguage } from './utils/cookieUtils';
import { directionOf, pickLanguage } from './utils/languageUtils';

export { directionOf };

export const applyDocumentDirection = (language: string): void => {
  const root = document.documentElement;

  root.lang = language;
  root.dir = directionOf(language);
};

// A server's detection from its request's `Cookie` and `Accept-Language` tags. The browser's detector reads the same
// cookie.
export const detectLanguage = (cookies: string, preferred: readonly string[]): string => {
  const stored = storedLanguage(cookies);

  return pickLanguage(stored, preferred);
};

// The one writer of the stored choice.
export const chooseLanguage = async (language: string): Promise<void> => {
  document.cookie = languageCookie(language);
  await i18next.changeLanguage(language);
};

// A server render names its language: it has neither the reader's cookie nor their browser.
export const initI18n = (options: Pick<InitOptions, 'lng'> = {}): typeof i18next => {
  if (!i18next.isInitialized) {
    void i18next
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        ...options,
        fallbackLng: fallbackLanguage,
        supportedLngs: languages
          .map((option) => {
            return option.id;
          }),
        defaultNS: 'common',
        initAsync: false,
        // Single braces, the placeholder style the locale files use, not i18next's default double.
        interpolation: {
          escapeValue: false,
          prefix: '{',
          suffix: '}',
        },
        detection: {
          order: ['cookie', 'navigator'],
          // Nothing is stored on detection: a first visit would otherwise look like a choice.
          caches: [],
          lookupCookie: languageStorageKey,
        },
      });

    i18next.on('languageChanged', applyDocumentDirection);
  }

  return i18next;
};
