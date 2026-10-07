import { omitBy } from 'es-toolkit';

import { LANGUAGES } from '@config/constants';

import { localesOf } from '@utils/answerUtils';
import { isJsonObject, parsedAs } from '@utils/objectUtils';

import {
  MSW_TWIN,
  TRANSLATED_CONFIGS,
  TWINNED_KEY,
} from '../constants';

import {
  hasI18n,
  hasMsw,
  starterApplies,
} from './gateUtils';
import {
  filesAt,
  variantOf,
} from './starterUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

export interface I18nFileLists {
  // Each rewritten by i18n, so each ships as the pair `translated` makes.
  readonly translated: readonly string[];
  // Pairs whose base carries its own condition, such as the root layout's styling.
  readonly pairs?: readonly StarterFile[];
  // Written only when i18n is on.
  readonly only: readonly string[];
}

const englishHalf = <T extends StarterFile | StarterTest>(file: T): T => {
  const half: T = {
    ...file,
    when: (answers: Answers) => {
      return starterApplies(file, answers) && !hasI18n(answers);
    },
  };

  return half;
};

const i18nHalf = <T extends StarterFile | StarterTest>(file: T): T => {
  const half: T = {
    ...file,
    when: (answers: Answers) => {
      return starterApplies(file, answers) && hasI18n(answers);
    },
    variant: variantOf(file, 'i18n'),
  };

  return half;
};

// A file i18n rewrites ships as a pair that exclude each other, its `i18n` asset beside its base's.
export const translated = <T extends StarterFile | StarterTest>(file: T): T[] => {
  const variants: T[] = [englishHalf(file), i18nHalf(file)];

  return variants;
};

// What i18n rewrites in a starter: the shared configs, then the target's own lists.
export const i18nFiles = ({
  translated: own,
  pairs = [],
  only,
}: I18nFileLists): StarterFile[] => {
  const files: StarterFile[] = [
    ...TRANSLATED_CONFIGS
      .flatMap((target) => {
        return translated<StarterFile>({
          target,
          shared: true,
        });
      }),
    ...own
      .flatMap((target) => {
        return translated<StarterFile>({ target });
      }),
    ...pairs
      .flatMap((file) => {
        return translated(file);
      }),
    ...filesAt(only, {
      when: hasI18n,
      variant: 'i18n',
    }),
  ];

  return files;
};

const isLocale = (value: unknown): value is Record<string, string> => {
  return isJsonObject(value)
    && Object.values(value)
      .every((text) => {
        return typeof text === 'string';
      });
};

// A locale it cannot read is left as written, for the project's own check to refuse.
const withoutContact = (source: string): string => {
  const locale = parsedAs(source, isLocale);

  if (locale === null) {
    return source;
  }

  const kept = omitBy(locale, (_, key) => {
    return key.startsWith('contact');
  });

  return `${JSON.stringify(kept, null, 2)}\n`;
};

/**
 * Every target reads the same locales, so a key added once reaches all of them; a project with no contact page
 * gets none of its keys, and one with a contact page gets each key's `Msw` twin in its place under MSW.
 * No predicate: the target has no contact page.
 */
export const localeFiles = (hasContact?: (answers: Answers) => boolean): StarterFile[] => {
  return LANGUAGES
    .map((language): StarterFile => {
      const localeFile: StarterFile = {
        target: `src/i18n/locales/${language}/common.json`,
        when: (answers) => {
          return localesOf(answers).includes(language);
        },
        variant: 'i18n',
        shared: true,
        transform: (source, answers) => {
          if (hasContact?.(answers) !== true) {
            return withoutContact(source);
          }

          return hasMsw(answers) ? source.replaceAll(TWINNED_KEY, '  "$<key>": ') : source.replaceAll(MSW_TWIN, '');
        },
      };

      return localeFile;
    });
};

export const LOCALES_TEST: StarterTest = {
  target: 'src/i18n/locales.test.ts',
  covers: 'src/i18n/i18n.ts',
  when: hasI18n,
  variant: 'i18n',
  shared: true,
};

const LANGUAGE_UTILS = 'src/i18n/utils/languageUtils';

// The framework-free language helpers every i18n module reads, under the name the target writes.
export const languageUtilsFile = (name = 'languageUtils'): StarterFile => {
  const file: StarterFile = {
    target: `src/i18n/utils/${name}.ts`,
    source: `${LANGUAGE_UTILS}.ts`,
    when: hasI18n,
    variant: 'i18n',
    shared: true,
  };

  return file;
};

export const languageUtilsTest = (name = 'languageUtils', suffix = 'test'): StarterTest => {
  const test: StarterTest = {
    target: `src/i18n/utils/${name}.${suffix}.ts`,
    covers: `src/i18n/utils/${name}.ts`,
    source: `${LANGUAGE_UTILS}.test.ts`,
    when: hasI18n,
    variant: 'i18n',
    shared: true,
  };

  return test;
};
