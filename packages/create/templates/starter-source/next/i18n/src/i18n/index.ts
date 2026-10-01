import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
} from './config';

export type Language = (typeof languages)[number]['id'];

const listeners = new Set<() => void>();

const isLanguage = (tag: string | null): tag is Language => {
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

// The stored choice, then the browser's languages, then English. Nothing detected is stored.
export const detectLanguage = (): Language => {
  const stored = localStorage.getItem(languageStorageKey);

  if (isLanguage(stored)) {
    return stored;
  }

  return navigator.languages
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
  localStorage.setItem(languageStorageKey, language);

  for (const listener of listeners) {
    listener();
  }
};
