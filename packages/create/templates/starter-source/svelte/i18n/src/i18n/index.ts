import { fromStore, writable } from 'svelte/store';

import { m } from '../../.svelte-kit/paraglide/messages.js';
import { overwriteGetLocale } from '../../.svelte-kit/paraglide/runtime.js';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
} from './config';

export type Language = (typeof languages)[number]['id'];

export { m };

const isLanguage = (tag: string | null): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

// English on the server and through hydration, so the first client render matches the server's.
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

// The stored choice, then the browser's languages, then English. Nothing detected is stored.
export const detectLanguage = (): Language => {
  const stored = localStorage.getItem(languageStorageKey);

  if (isLanguage(stored)) {
    return stored;
  }

  return navigator.languages
    .flatMap((tag) => {
      return [tag, new Intl.Locale(tag).language];
    })
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

  localStorage.setItem(languageStorageKey, language);
  applyLanguage(language);
};
