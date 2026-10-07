import { hasI18n } from '../../utils/gateUtils';
import { i18nFiles, translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY_FILES,
  I18N_ONLY_SUITES,
  TRANSLATED,
  TRANSLATED_SUITES,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the Angular starter, each as the pair `translated` makes.
export const angularI18nFiles = (): StarterFile[] => {
  return i18nFiles({
    translated: TRANSLATED,
    only: I18N_ONLY_FILES,
  });
};

export const angularI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...I18N_ONLY_SUITES
      .map((file): StarterTest => {
        const test: StarterTest = {
          target: `${file}.spec.ts`,
          covers: `${file}.ts`,
          when: hasI18n,
          variant: 'i18n',
        };

        return test;
      }),
    ...TRANSLATED_SUITES
      .flatMap((file) => {
        return translated<StarterTest>({
          target: `${file}.spec.ts`,
          covers: `${file}.ts`,
        });
      }),
  ];

  return tests;
};
