import { createSignal } from 'solid-js';

import { type TemplateResolver, translator as createTranslator } from '@solid-primitives/i18n';

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

const [language, setLanguage] = createSignal<Language>(fallbackLanguage);

export { language };

// The library's own resolver reads `{{x}}`; every target's locales hold `{x}`.
const resolveTemplate: TemplateResolver = (template, args) => {
  return template
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return String(args?.[name] ?? match);
    });
};

// Read inside JSX, so every rendered message follows the language. Named `create` so the reactivity rule reads
// the dictionary as tracked, which it is: each call reads the signal afresh.
export const t = createTranslator(() => {
  return resources[language()].common;
}, resolveTemplate);

export const isMessageKey = (key: string): key is MessageKey => {
  return key in resources[language()].common;
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
