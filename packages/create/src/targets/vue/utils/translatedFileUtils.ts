import { hasForm, hasI18n } from '../../utils/gateUtils';
import { i18nFiles, translated } from '../../utils/i18nUtils';
import { I18N_ONLY, TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const I18N_ONLY_FILES = [
  ...I18N_ONLY
    .map((component) => {
      return `${component}.vue`;
    }),
  'src/i18n/i18n.ts',
];

const TRANSLATED_SUITES = ['src/App', 'src/components/features/status-page/StatusPage'];

// What i18n rewrites in the Vue starter, each as the pair `translated` makes.
export const vueI18nFiles = (): StarterFile[] => {
  return i18nFiles({
    translated: TRANSLATED,
    contact: {
      target: 'src/views/contact/ContactView.vue',
      when: hasForm,
    },
    only: I18N_ONLY_FILES,
  });
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
      target: 'src/i18n/i18n.test.ts',
      covers: 'src/i18n/i18n.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
