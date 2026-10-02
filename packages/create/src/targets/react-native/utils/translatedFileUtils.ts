import { TRANSLATED_CONFIGS } from '../../constants';
import { hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY_FILES,
  I18N_ONLY_SUITES,
  TRANSLATED,
  TRANSLATED_SUITES,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the React Native starter, each as the pair `translated` makes.
export const reactNativeI18nFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    ...TRANSLATED_CONFIGS
      .flatMap((target) => {
        return translated<StarterFile>({
          target,
          shared: true,
        });
      }),
    ...TRANSLATED
      .flatMap((target) => {
        return translated<StarterFile>({ target });
      }),
    // The root layout imports the stylesheet, which Metro reads only through NativeWind.
    ...translated<StarterFile>({
      target: 'src/app/_layout.tsx',
      when: (answers) => {
        return answers.styling !== 'tailwind';
      },
    }),
    ...translated<StarterFile>({
      target: 'src/app/_layout.tsx',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
    }),
    ...I18N_ONLY_FILES
      .map((target): StarterFile => {
        const file: StarterFile = {
          target,
          when: hasI18n,
          variant: 'i18n',
        };

        return file;
      }),
  ];

  return files;
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
