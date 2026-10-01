import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';

export type Language = (typeof languages)[number]['id'];

export type MessageKey = keyof (typeof resources)[Language]['common'];

const isLanguage = (tag: string | null): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

export const t = (
  key: MessageKey,
  language: Language,
  values?: Readonly<Record<string, string>>,
): string => {
  return resources[language].common[key]
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return values?.[name] ?? match;
    });
};

// The odd parts sit inside `<code>`.
export const partsOf = (text: string): string[] => {
  return text.split(/<\/?code>/u);
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
    .flatMap(lookupTags)
    .find(isLanguage) ?? fallbackLanguage;
};

// The one writer of the stored choice.
export const chooseLanguage = (tag: string): void => {
  if (isLanguage(tag)) {
    localStorage.setItem(languageStorageKey, tag);
  }
};
