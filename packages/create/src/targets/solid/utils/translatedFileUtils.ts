import { hasForm, hasI18n } from '../../utils/gateUtils';
import { i18nFiles } from '../../utils/i18nUtils';
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
  'src/i18n/i18n.ts',
];

// What i18n rewrites in the Solid starter, each as the pair `translated` makes.
export const solidI18nFiles = (): StarterFile[] => {
  return i18nFiles({
    translated: TRANSLATED,
    contact: {
      target: 'src/pages/contact/ContactPage.tsx',
      when: hasForm,
    },
    only: I18N_ONLY_FILES,
  });
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
      target: 'src/i18n/i18n.test.ts',
      covers: 'src/i18n/i18n.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
