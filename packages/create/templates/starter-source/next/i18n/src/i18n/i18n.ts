import { languageCookie, storedLanguage } from './utils/cookieUtils';
import {
  directionOf,
  type Language,
  pickLanguage,
} from './utils/languageUtils';

export { directionOf, type Language };

const listeners = new Set<() => void>();

export const applyDocumentDirection = (language: string): void => {
  const root = document.documentElement;

  root.lang = language;
  root.dir = directionOf(language);
};

// The server passes its request's `Cookie` and `Accept-Language`; the browser reads its own.
export const detectLanguage = (
  cookies: string = document.cookie,
  preferred: readonly string[] = navigator.languages,
): Language => {
  const stored = storedLanguage(cookies);

  return pickLanguage(stored, preferred);
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
