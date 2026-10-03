import {
  fallbackLanguage,
  languages,
  lookupTags,
} from './config';
import { languageCookie, storedLanguage } from './utils/cookieUtils';

export type Language = (typeof languages)[number]['id'];

const listeners = new Set<() => void>();

const isLanguage = (tag: string | undefined): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

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

// The stored choice, then the reader's languages, then English. Nothing detected is stored.
// The server passes its request's `Cookie` and `Accept-Language`; the browser reads its own.
export const detectLanguage = (
  cookies: string = document.cookie,
  preferred: readonly string[] = navigator.languages,
): Language => {
  const stored = storedLanguage(cookies);

  if (isLanguage(stored)) {
    return stored;
  }

  return preferred
    .flatMap(lookupTags)
    .find(isLanguage) ?? fallbackLanguage;
};

export const subscribeLanguage = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// The one writer of the stored choice.
export const chooseLanguage = (language: string): void => {
  document.cookie = languageCookie(language);

  for (const listener of listeners) {
    listener();
  }
};
