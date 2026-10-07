import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  lookupTags,
  resources,
} from './config';
import { languageCookie } from './utils/cookieUtils';
import {
  directionOf,
  formatMessage,
  isLanguage,
  type Language,
  partsOf,
} from './utils/languageUtils';

export type MessageKey = keyof (typeof resources)[Language]['common'];

type Values = Readonly<Record<string, string | undefined>>;

interface LanguageOption {
  readonly id: string;
  readonly dir: string;
}

const isMessageKey = (key: string | undefined): key is MessageKey => {
  return key !== undefined && key in resources[fallbackLanguage].common;
};

// Pages render English at build time; the client renders each marked element again in the chosen language.
export const t = (key: MessageKey, values?: Values, language: Language = fallbackLanguage): string => {
  return formatMessage(resources[language].common[key], values);
};

// A page id is its own key, so one no locale names yet shows as the id.
export const translateId = (id: string): string => {
  return isMessageKey(id) ? t(id) : id;
};

// The stored cookie, then the browser's languages, then English. Nothing detected is stored. Self-contained, cookie
// parse and `prefixesOf` included: the pages are static, so this inlined script sets lang and dir before first paint.
export const bootLanguage = (
  options: readonly LanguageOption[],
  storageKey: string,
  fallback: string,
  prefixesOf: (tag: string) => string[],
): void => {
  const offered = (tag: string | undefined): tag is string => {
    return options
      .some((option) => {
        return option.id === tag;
      });
  };

  const prefix = `${storageKey}=`;
  const stored = document.cookie
    .split(';')
    .map((pair) => {
      return pair.trim();
    })
    .find((pair) => {
      return pair.startsWith(prefix);
    })
    ?.slice(prefix.length);
  const id = offered(stored)
    ? stored
    : navigator.languages
      .flatMap(prefixesOf)
      .find(offered) ?? fallback;
  const root = document.documentElement;

  root.lang = id;

  root.dir = options
    .find((option) => {
      return option.id === id;
    })?.dir ?? 'ltr';
};

export const bootScript = (): string => {
  const args = [
    languages,
    languageStorageKey,
    fallbackLanguage,
  ]
    .map((arg) => {
      return JSON.stringify(arg);
    });
  const call = [...args, lookupTags.toString()].join(', ');

  return `(${bootLanguage.toString()})(${call});`;
};

// The odd parts of a message sit inside `<code>`.
const nodeOf = (part: string, index: number): Node => {
  if (index % 2 === 0) {
    return document.createTextNode(part);
  }

  const code = document.createElement('code');

  code.textContent = part;

  return code;
};

// An element's `data-*` attributes fill its placeholders.
const render = (element: HTMLElement, language: Language): void => {
  const key = element.dataset.i18n;

  if (!isMessageKey(key)) {
    return;
  }

  const text = t(key, element.dataset, language);
  const nodes = partsOf(text)
    .map(nodeOf);

  element.replaceChildren(...nodes);
};

const pickerOf = (): HTMLSelectElement | undefined => {
  const picker = document.querySelector('[data-language]');

  return picker instanceof HTMLSelectElement ? picker : undefined;
};

export const applyLanguage = (language: Language): void => {
  const root = document.documentElement;
  const picker = pickerOf();

  root.lang = language;
  root.dir = directionOf(language);

  document.querySelectorAll<HTMLElement>('[data-i18n]')
    .forEach((element) => {
      render(element, language);
    });

  if (picker !== undefined) {
    picker.value = language;
    picker.setAttribute('aria-label', t('language', undefined, language));
  }
};

// The one writer of the stored choice.
export const chooseLanguage = (tag: string): void => {
  if (!isLanguage(tag)) {
    return;
  }

  document.cookie = languageCookie(tag);
  applyLanguage(tag);
};

// Renders the language the inlined boot script put on `<html>`, and wires the select.
export const startLanguage = (): void => {
  const { lang } = document.documentElement;
  const picker = pickerOf();

  picker
    ?.addEventListener('change', () => {
      chooseLanguage(picker.value);
    });

  applyLanguage(isLanguage(lang) ? lang : fallbackLanguage);
};

export {
  directionOf,
  type Language,
  partsOf,
};
