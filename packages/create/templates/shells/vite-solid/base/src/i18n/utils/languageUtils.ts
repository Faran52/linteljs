import {
  fallbackLanguage,
  languages,
  lookupTags,
} from '../config';

export type Language = (typeof languages)[number]['id'];

type Values = Readonly<Record<string, string | undefined>>;

export const isLanguage = (tag: string | null | undefined): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

export const directionOf = (tag: string): 'ltr' | 'rtl' => {
  return languages
    .find((option) => {
      return option.id === tag;
    })?.dir ?? 'ltr';
};

// The stored choice, then the reader's languages, then English. Nothing detected is stored.
export const pickLanguage = (stored: string | null | undefined, preferred: readonly string[]): Language => {
  if (isLanguage(stored)) {
    return stored;
  }

  return preferred
    .flatMap(lookupTags)
    .find(isLanguage) ?? fallbackLanguage;
};

// The locales hold single-brace placeholders, `{name}`; one with no value stays as written.
export const formatMessage = (template: string, values?: Values): string => {
  return template
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return values?.[name] ?? match;
    });
};

// The odd parts sit inside `<code>`.
export const partsOf = (text: string): string[] => {
  return text.split(/<\/?code>/u);
};
