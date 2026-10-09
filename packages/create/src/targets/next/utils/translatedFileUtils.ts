import { hasForm, hasI18n } from '../../utils/gateUtils';
import { i18nFiles, translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY,
  STATUS_PAGE,
  TRANSLATED,
  TRANSLATED_SUITES,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// React's own, since it renders the string `t.markup` makes.
const CODE_TEXT = 'src/components/ui/code-text/CodeText';

// What i18n rewrites in the Next starter, each as the pair `translated` makes.
export const nextI18nFiles = (): StarterFile[] => {
  const i18nOnly = [
    ...I18N_ONLY
      .map((component) => {
        return `${component}.tsx`;
      }),
    'src/i18n/i18n.ts',
  ];
  const files: StarterFile[] = [
    ...i18nFiles({
      translated: TRANSLATED,
      pairs: [
        {
          target: 'src/app/contact/page.tsx',
          when: hasForm,
        },
      ],
      only: i18nOnly,
    }),
    {
      target: `${CODE_TEXT}.tsx`,
      when: hasI18n,
      variant: 'i18n',
      shared: 'react',
    },
  ];

  return files;
};

export const nextI18nTests = (): StarterTest[] => {
  const i18nSuites = [...I18N_ONLY, STATUS_PAGE];
  const tests: StarterTest[] = [
    ...TRANSLATED_SUITES
      .flatMap((suite) => {
        return translated<StarterTest>({
          target: `${suite}.test.tsx`,
          covers: `${suite}.tsx`,
        });
      }),
    // React's English suite fits Next's page, but the twin wraps its render in Next's provider.
    {
      target: `${STATUS_PAGE}.test.tsx`,
      covers: `${STATUS_PAGE}.tsx`,
      when: (answers) => {
        return !hasI18n(answers);
      },
      shared: 'react',
    },
    ...i18nSuites
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
      target: `${CODE_TEXT}.test.tsx`,
      covers: `${CODE_TEXT}.tsx`,
      when: hasI18n,
      variant: 'i18n',
      shared: 'react',
    },
    {
      target: 'src/i18n/i18n.test.ts',
      covers: 'src/i18n/i18n.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
