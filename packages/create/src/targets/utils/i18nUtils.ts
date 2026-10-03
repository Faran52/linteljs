import { LANGUAGES } from '@config/constants';

import { localesOf } from '@utils/answerUtils';

import { hasI18n, starterApplies } from './gateUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

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

// Every target reads the same locales, so a key added once reaches all of them.
export const localeFiles = (): StarterFile[] => {
  return LANGUAGES
    .map((language): StarterFile => {
      const localeFile: StarterFile = {
        target: `src/i18n/locales/${language}/common.json`,
        when: (answers) => {
          return localesOf(answers).includes(language);
        },
        variant: 'i18n',
        shared: true,
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
