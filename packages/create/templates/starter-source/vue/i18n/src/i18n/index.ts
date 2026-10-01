import { createI18n } from 'vue-i18n';

import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';

export type Language = (typeof languages)[number]['id'];

const isLanguage = (tag: string | null): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

// vue-i18n reads `@` as the start of a linked message, so each is quoted as a literal.
const literal = (text: string): string => {
  return text.replaceAll('@', '{\'@\'}');
};

const messages = Object.fromEntries(languages
  .map(({ id }) => {
    const bundle = Object.entries(resources[id].common)
      .map(([key, text]) => {
        return [key, literal(text)];
      });

    return [id, Object.fromEntries(bundle)];
  }));

// CodeText splits each `<code>` itself, so no message is rendered as HTML.
export const i18n = createI18n({
  legacy: false,
  locale: fallbackLanguage,
  fallbackLocale: fallbackLanguage,
  messages,
  warnHtmlMessage: false,
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
    .flatMap(lookupTags)
    .find(isLanguage) ?? fallbackLanguage;
};

export const applyLanguage = (language: string): void => {
  const root = document.documentElement;

  i18n.global.locale.value = language;
  root.lang = language;
  root.dir = directionOf(language);
};

// The one writer of the stored choice.
export const chooseLanguage = (language: string): void => {
  localStorage.setItem(languageStorageKey, language);
  applyLanguage(language);
};
