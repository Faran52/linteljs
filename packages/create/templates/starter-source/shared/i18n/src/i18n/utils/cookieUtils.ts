import { languageStorageKey } from '../config';

const YEAR_IN_SECONDS = 31_536_000;

// A cookie rather than storage: the server reads it on the first request and renders in the choice.
export const languageCookie = (language: string): string => {
  return `${languageStorageKey}=${language}; path=/; max-age=${String(YEAR_IN_SECONDS)}; samesite=lax`;
};

// From a `Cookie` header or `document.cookie`, which share one shape. Raw, not decoded: a language id is plain ASCII,
// and the caller only takes one it offers.
export const storedLanguage = (cookies: string): string | undefined => {
  const prefix = `${languageStorageKey}=`;
  return cookies
    .split(';')
    .map((pair) => {
      return pair.trim();
    })
    .find((pair) => {
      return pair.startsWith(prefix);
    })
    ?.slice(prefix.length);
};

const weightOf = (parameter: string | undefined): number => {
  const weight = Number(parameter
    ?.trim()
    .replace(/^q=/u, '') ?? '1');

  return Number.isNaN(weight) ? 0 : weight;
};

// `Accept-Language`'s tags, most wanted first: `ja;q=0.5, ar` reads as `ar`, `ja`.
export const acceptedTags = (header: string): string[] => {
  return header
    .split(',')
    .map((entry) => {
      const [tag = '', parameter] = entry.split(';');
      const accepted = {
        tag: tag.trim(),
        weight: weightOf(parameter),
      };

      return accepted;
    })
    .filter(({ tag, weight }) => {
      return tag !== '' && tag !== '*' && weight > 0;
    })
    .toSorted((left, right) => {
      return right.weight - left.weight;
    })
    .map(({ tag }) => {
      return tag;
    });
};
