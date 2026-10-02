import { TRANSLATED_CONFIGS } from '../../constants';
import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY,
  I18N_ONLY_SUITES,
  TRANSLATED,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const I18N_ONLY_FILES = [
  ...I18N_ONLY
    .map((component) => {
      return `${component}.tsx`;
    }),
  'src/i18n/index.ts',
];

// What i18n rewrites in the Solid starter, each as the pair `translated` makes.
export const solidI18nFiles = (): StarterFile[] => {
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
    ...translated<StarterFile>({
      target: 'src/pages/contact/ContactPage.tsx',
      when: hasForm,
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

// `App`'s suite covers the English header; the translated one adds the switcher, so it takes its own.
export const solidI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...I18N_ONLY_SUITES
      .map((component): StarterTest => {
        const test: StarterTest = {
          target: `${component}.test.tsx`,
          covers: `${component}.tsx`,
          when: hasI18n,
          variant: 'i18n',
        };

        return test;
      }),
    {
      target: 'src/i18n/index.test.ts',
      covers: 'src/i18n/index.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
