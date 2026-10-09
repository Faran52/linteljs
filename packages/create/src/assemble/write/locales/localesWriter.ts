import { join } from 'node:path';

import { parsedAs } from '@utils/objectUtils';

import { readIfPresent } from '@disk';

import {
  isShare,
  mergedShare,
  type Share,
} from '../../utils/shareUtils';

export interface Locale {
  path: string;
  text: string;
}

const namespaceOf = async (root: string, language: string, namespace: string): Promise<Share> => {
  const path = join(root, 'common', 'languages', language, `${namespace}.json`);
  const text = await readIfPresent(path);
  const strings = parsedAs(text, isShare);

  if (strings === null) {
    throw new Error(`${path} is missing or not an object`);
  }

  return strings;
};

// The namespaces the drawers name fold into one `<language>/common.json` per language.
export const localesWriter = async (
  root: string,
  languages: readonly string[],
  namespaces: readonly string[],
): Promise<Locale[]> => {
  const locales = languages
    .map(async (language) => {
      const reads = namespaces
        .map(async (namespace) => {
          return await namespaceOf(root, language, namespace);
        });
      const shares = await Promise.all(reads);
      const merged = shares
        .reduce<Share>((left, right) => {
          return mergedShare(left, right);
        }, {});
      const locale: Locale = {
        path: `${language}/common.json`,
        text: `${JSON.stringify(merged, null, 2)}\n`,
      };

      return locale;
    });

  return await Promise.all(locales);
};
