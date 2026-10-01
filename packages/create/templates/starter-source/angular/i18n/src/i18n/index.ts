import { signal } from '@angular/core';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  resources,
} from './config';

export type Language = (typeof languages)[number]['id'];

export type MessageKey = keyof (typeof resources)[Language]['common'];

const isLanguage = (tag: string | null): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

const current = signal<Language>(fallbackLanguage);

export const language = current.asReadonly();

// Read in a template, so every rendered message follows the language signal.
export const t = (key: MessageKey, values?: Readonly<Record<string, string>>): string => {
  return resources[current()].common[key]
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return values?.[name] ?? match;
    });
};

const isMessageKey = (key: string): key is MessageKey => {
  return key in resources[current()].common;
};

// A page id is its own key, so one no locale names yet shows as the id.
export const translateId = (id: string): string => {
  return isMessageKey(id) ? t(id) : id;
};

export const directionOf = (tag: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === tag;
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

export const applyLanguage = (next: Language): void => {
  const root = document.documentElement;

  current.set(next);
  root.lang = next;
  root.dir = directionOf(next);
};

// The one writer of the stored choice.
export const chooseLanguage = (tag: string): void => {
  if (!isLanguage(tag)) {
    return;
  }

  localStorage.setItem(languageStorageKey, tag);
  applyLanguage(tag);
};
