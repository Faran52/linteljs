import { hasForm, hasI18n } from '../../utils/gateUtils';
import {
  i18nFiles,
  translated,
} from '../../utils/i18nUtils';
import {
  I18N_ONLY_FILES,
  I18N_ONLY_SUITES,
  TRANSLATED,
  TRANSLATED_SUITES,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the React Native starter, each as the pair `translated` makes.
export const reactNativeI18nFiles = (): StarterFile[] => {
  return i18nFiles({
    translated: TRANSLATED,
    // The root layout imports the stylesheet, which Metro reads only through NativeWind.
    pairs: [
      {
        target: 'src/app/_layout.tsx',
        when: (answers) => {
          return answers.styling !== 'tailwind';
        },
      },
      {
        target: 'src/app/_layout.tsx',
        when: (answers) => {
          return answers.styling === 'tailwind';
        },
        variant: 'tailwind',
      },
      {
        target: 'src/app/(tabs)/contact.tsx',
        when: hasForm,
      },
    ],
    only: I18N_ONLY_FILES,
  });
};

export const reactNativeI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...TRANSLATED_SUITES
      .flatMap(([target, covers]) => {
        return translated<StarterTest>({
          target,
          covers,
        });
      }),
    ...translated<StarterTest>({
      target: 'src/app-tabs-contact.test.tsx',
      covers: 'src/app/(tabs)/contact.tsx',
      when: hasForm,
    }),
    ...I18N_ONLY_SUITES
      .map(([target, covers]): StarterTest => {
        const test: StarterTest = {
          target,
          covers,
          when: hasI18n,
          variant: 'i18n',
        };

        return test;
      }),
  ];

  return tests;
};
