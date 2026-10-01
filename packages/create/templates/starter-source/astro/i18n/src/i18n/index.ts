import {
  fallbackLanguage,
  languages,
  languageStorageKey,
  resources,
} from './config';

export type Language = (typeof languages)[number]['id'];

export type MessageKey = keyof (typeof resources)[Language]['common'];

type Values = Readonly<Record<string, string | undefined>>;

interface LanguageOption {
  readonly id: string;
  readonly dir: string;
}

const isLanguage = (tag: string | null): tag is Language => {
  return languages.some((option) => {
    return option.id === tag;
  });
};

const isMessageKey = (key: string | undefined): key is MessageKey => {
  return key !== undefined && key in resources[fallbackLanguage].common;
};

// Pages render English at build time; the client renders each marked element again in the chosen language.
export const t = (key: MessageKey, values?: Values, language: Language = fallbackLanguage): string => {
  return resources[language].common[key]
    .replace(/\{(\w+)\}/gu, (match, name: string) => {
      return values?.[name] ?? match;
    });
};

// A page id is its own key, so one no locale names yet shows as the id.
export const translateId = (id: string): string => {
  return isMessageKey(id) ? t(id) : id;
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
// Self-contained: the layout inlines its source, so lang and dir are set before the first paint.
export const bootLanguage = (
  options: readonly LanguageOption[],
  storageKey: string,
  fallback: string,
): void => {
  const offered = (tag: string | null): tag is string => {
    return options
      .some((option) => {
        return option.id === tag;
      });
  };
  const stored = localStorage.getItem(storageKey);
  const id = offered(stored)
    ? stored
    : navigator.languages
      .flatMap((tag) => {
        return [tag, new Intl.Locale(tag).language];
      })
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

  return `(${bootLanguage.toString()})(${args.join(', ')});`;
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

  element.replaceChildren(...partsOf(t(key, element.dataset, language))
    .map(nodeOf));
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

  localStorage.setItem(languageStorageKey, tag);
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
