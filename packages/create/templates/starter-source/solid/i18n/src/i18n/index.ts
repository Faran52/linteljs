import { createSignal } from 'solid-js';

import { type TemplateResolver, translator as createTranslator } from '@solid-primitives/i18n';

import {
  fallbackLanguage,
  languageStorageKey,
  resources,
} from './config';
import {
  directionOf,
  isLanguage,
  type Language,
  pickLanguage,
} from './utils/languageUtils';

export type MessageKey = keyof (typeof resources)[Language]['common'];

const [language, setLanguage] = createSignal<Language>(fallbackLanguage);

export { language };

// The library's own resolver reads `{{x}}`; these locales hold `{x}`.
const resolveTemplate: TemplateResolver = (template, ...args) => {
  const [values] = args;

  return template
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return String(values?.[name] ?? match);
    });
};

// Read inside JSX, so every rendered message follows the language. Named `create` so the reactivity rule reads
// the dictionary as tracked, which it is: each call reads the signal afresh.
export const t = createTranslator(() => {
  return resources[language()].common;
}, resolveTemplate);

const isMessageKey = (key: string): key is MessageKey => {
  return key in resources[language()].common;
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

  setLanguage(() => {
    return next;
  });

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
