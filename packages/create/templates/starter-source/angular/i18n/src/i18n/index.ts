import { signal } from '@angular/core';

import {
  fallbackLanguage,
  languageStorageKey,
  resources,
} from './config';
import {
  directionOf,
  formatMessage,
  isLanguage,
  type Language,
  pickLanguage,
} from './utils/language-utils';

export type MessageKey = keyof (typeof resources)[Language]['common'];

const current = signal<Language>(fallbackLanguage);

export const language = current.asReadonly();

// Read in a template, so every rendered message follows the language signal.
export const t = (key: MessageKey, values?: Readonly<Record<string, string>>): string => {
  return formatMessage(resources[current()].common[key], values);
};

const isMessageKey = (key: string): key is MessageKey => {
  return key in resources[current()].common;
};

// A page id is its own key, so one no locale names yet shows as the id.
export const translateId = (id: string): string => {
  return isMessageKey(id) ? t(id) : id;
};

export const detectLanguage = (): Language => {
  const stored = localStorage.getItem(languageStorageKey);

  return pickLanguage(stored, navigator.languages);
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

export { directionOf, type Language };
