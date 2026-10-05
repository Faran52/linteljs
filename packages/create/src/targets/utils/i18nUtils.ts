import { omitBy } from 'es-toolkit';

import { LANGUAGES } from '@config/constants';

import { localesOf } from '@utils/answerUtils';
import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { TRANSLATED_CONFIGS } from '../constants';

import { hasI18n, starterApplies } from './gateUtils';
import { filesAt } from './starterUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

export interface I18nFileLists {
  // Each rewritten by i18n, so each ships as the pair `translated` makes.
  readonly translated: readonly string[];
  // Pairs whose base carries its own condition, such as the contact page's form.
  readonly pairs?: readonly StarterFile[];
  // Written only when i18n is on.
  readonly only: readonly string[];
}

// A file i18n rewrites ships as a pair that exclude each other, its `i18n` asset beside its base's.
export const translated = <T extends StarterFile | StarterTest>(file: T): T[] => {
  const variants: T[] = [
    {
      ...file,
      when: (answers: Answers) => {
        return starterApplies(file, answers) && !hasI18n(answers);
      },
    },
    {
      ...file,
      when: (answers: Answers) => {
        return starterApplies(file, answers) && hasI18n(answers);
      },
      variant: file.variant === undefined ? 'i18n' : `${file.variant}-i18n`,
    },
  ];

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
 * gets none of its keys.
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
          return hasContact?.(answers) === true ? source : withoutContact(source);
        },
      };

      return localeFile;
    });
};

export const LOCALES_TEST: StarterTest = {
  target: 'src/i18n/locales.test.ts',
  covers: 'src/i18n/index.ts',
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
