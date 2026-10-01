import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY,
  STATUS_PAGE,
  TRANSLATED,
  TRANSLATED_SUITES,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the Next starter, each as the pair `translated` makes.
export const nextI18nFiles = (): StarterFile[] => {
  return [
    ...(['src/config/statuses.ts', 'src/config/standard.ts'] as const)
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
      target: 'src/app/contact/page.tsx',
      when: hasForm,
    }),
    ...[
      ...I18N_ONLY
        .map((component) => {
          return `${component}.tsx`;
        }),
      'src/i18n/index.ts',
    ]
      .map((target): StarterFile => {
        return {
          target,
          when: hasI18n,
          variant: 'i18n',
        };
      }),
  ];
};

export const nextI18nTests = (): StarterTest[] => {
  return [
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
    ...[...I18N_ONLY, STATUS_PAGE]
      .map((component): StarterTest => {
        return {
          target: `${component}.test.tsx`,
          covers: `${component}.tsx`,
          when: hasI18n,
          variant: 'i18n',
        };
      }),
    {
      target: 'src/i18n/index.test.ts',
      covers: 'src/i18n/index.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];
};
