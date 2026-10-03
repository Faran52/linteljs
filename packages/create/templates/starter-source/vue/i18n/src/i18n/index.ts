import { createI18n, type I18n } from 'vue-i18n';

import {
  fallbackLanguage,
  languages,
  lookupTags,
  resources,
} from './config';
import { languageCookie, storedLanguage } from './utils/cookieUtils';

export type Language = (typeof languages)[number]['id'];

type Messages = Record<string, Record<string, string>>;

// No locale carries date or number formats.
type Unformatted = Record<string, never>;

// The composition API, which `i18n.global.locale.value` reads.
export type LanguageI18n = I18n<Messages, Unformatted, Unformatted, Language, false>;

const isLanguage = (tag: string | undefined): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

// vue-i18n reads `@` as the start of a linked message, so each is quoted as a literal.
const literal = (text: string): string => {
  return text.replaceAll('@', '{\'@\'}');
};

const messages: Messages = Object.fromEntries(languages
  .map(({ id }) => {
    const bundle = Object.entries(resources[id].common)
      .map(([key, text]) => {
        const message: [string, string] = [key, literal(text)];

        return message;
      });

    const localeMessages: [string, Record<string, string>] = [id, Object.fromEntries(bundle)];

    return localeMessages;
  }));

// CodeText splits each `<code>` itself, so no message is rendered as HTML.
// A server renders each request through its own, so two readers never share a language.
export const createLanguageI18n = (locale: Language): LanguageI18n => {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: fallbackLanguage,
    messages,
    warnHtmlMessage: false,
  });
};

export const i18n = createLanguageI18n(fallbackLanguage);

export const directionOf = (language: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === language;
    })?.dir ?? 'ltr';
};

// The stored choice, then the reader's languages, then English. Nothing detected is stored.
// A server passes its request's `Cookie` and `Accept-Language`; the browser reads its own.
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

export const applyLanguage = (language: string): void => {
  const root = document.documentElement;

  i18n.global.locale.value = language;
  root.lang = language;
  root.dir = directionOf(language);
};

// The one writer of the stored choice.
export const chooseLanguage = (language: string): void => {
  document.cookie = languageCookie(language);
  applyLanguage(language);
};
