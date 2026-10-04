import { languageStorageKey, resources } from './config';
import {
  directionOf,
  formatMessage,
  isLanguage,
  type Language,
  partsOf,
  pickLanguage,
} from './utils/languageUtils';

export type MessageKey = keyof (typeof resources)[Language]['common'];

export const t = (
  key: MessageKey,
  language: Language,
  values?: Readonly<Record<string, string>>,
): string => {
  return formatMessage(resources[language].common[key], values);
};

export const detectLanguage = (): Language => {
  const stored = localStorage.getItem(languageStorageKey);

  return pickLanguage(stored, navigator.languages);
};

// The one writer of the stored choice.
export const chooseLanguage = (tag: string): void => {
  if (isLanguage(tag)) {
    localStorage.setItem(languageStorageKey, tag);
  }
};

export {
  directionOf,
  type Language,
  partsOf,
};
