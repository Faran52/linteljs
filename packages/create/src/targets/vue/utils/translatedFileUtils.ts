import { TRANSLATED_CONFIGS } from '../../constants';
import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { I18N_ONLY, TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const I18N_ONLY_FILES = [
  ...I18N_ONLY
    .map((component) => {
      return `${component}.vue`;
    }),
  'src/i18n/index.ts',
];

const TRANSLATED_SUITES = ['src/App', 'src/components/features/status-page/StatusPage'];

// What i18n rewrites in the Vue starter, each as the pair `translated` makes.
export const vueI18nFiles = (): StarterFile[] => {
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
      target: 'src/views/ContactView.vue',
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

// Mounting `App` walks every page, so its twin switches each one from the header.
export const vueI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...TRANSLATED_SUITES
      .flatMap((suite) => {
        return translated<StarterTest>({
          target: `${suite}.test.ts`,
          covers: `${suite}.vue`,
        });
      }),
    ...I18N_ONLY
      .map((component): StarterTest => {
        const test: StarterTest = {
          target: `${component}.test.ts`,
          covers: `${component}.vue`,
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
