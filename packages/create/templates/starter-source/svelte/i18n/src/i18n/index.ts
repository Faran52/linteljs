import { fromStore, writable } from 'svelte/store';

import { m } from '../../.svelte-kit/paraglide/messages.js';
import { overwriteGetLocale } from '../../.svelte-kit/paraglide/runtime.js';

import {
  fallbackLanguage,
  languages,
  lookupTags,
} from './config';
import { languageCookie, storedLanguage } from './utils/cookieUtils';

export type Language = (typeof languages)[number]['id'];

export { m };

const isLanguage = (tag: string | undefined): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

// Set from the request's language before each render, on the server and in hydration alike.
export const locale = writable<Language>(fallbackLanguage);

// Read as a signal, so every rendered message follows the language.
const current = fromStore(locale);

overwriteGetLocale(() => {
  return current.current;
});

export const directionOf = (language: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === language;
    })?.dir ?? 'ltr';
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
