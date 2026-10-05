import { initReactI18next } from 'react-i18next';

import i18next, { type InitOptions } from 'i18next';

import {
  fallbackLanguage,
  languages,
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

// The stored choice, then the reader's languages: a server passes its request's `Cookie` and `Accept-Language`, the
// browser its own, so every target detects by one rule.
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
      .use(initReactI18next)
      .init({
        resources,
        lng: options.lng ?? detectLanguage(document.cookie, navigator.languages),
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
      });

    i18next.on('languageChanged', applyDocumentDirection);
  }

  return i18next;
};
