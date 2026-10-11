import { fromStore, writable } from 'svelte/store';

import { m } from '../../.svelte-kit/paraglide/messages.js';
import { overwriteGetLocale } from '../../.svelte-kit/paraglide/runtime.js';

import { fallbackLanguage } from './config';
import { languageCookie, storedLanguage } from './utils/cookieUtils';
import {
  directionOf,
  isLanguage,
  type Language,
  pickLanguage,
} from './utils/languageUtils';

export { directionOf, type Language };

export { m };

// Set from the request's language before each render, on the server and in hydration alike.
export const locale = writable<Language>(fallbackLanguage);

// Read as a signal, so every rendered message follows the language.
const current = fromStore(locale);

overwriteGetLocale(() => {
  return current.current;
});

// The server passes its request's `Cookie` and `Accept-Language`; the browser reads its own.
export const detectLanguage = (
  cookies: string = document.cookie,
  preferred: readonly string[] = navigator.languages,
): Language => {
  const stored = storedLanguage(cookies);

  return pickLanguage(stored, preferred);
};

export const applyLanguage = (language: Language): void => {
  const root = document.documentElement;

  locale.set(language);
  root.lang = language;
  root.dir = directionOf(language);
};

// The one writer of the stored choice.
export const chooseLanguage = (language: string): void => {
  if (!isLanguage(language)) {
    return;
  }

  document.cookie = languageCookie(language);
  applyLanguage(language);
};
