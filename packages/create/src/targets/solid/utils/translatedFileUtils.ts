import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { I18N_ONLY, TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const HEADER = 'src/components/features/app-header/AppHeader';

// What i18n rewrites in the Solid starter, each as the pair `translated` makes.
export const solidI18nFiles = (): StarterFile[] => {
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
      target: 'src/pages/contact/ContactPage.tsx',
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

// `App`'s suite covers the English header; the translated one adds the switcher, so it takes its own.
export const solidI18nTests = (): StarterTest[] => {
  return [
    ...[...I18N_ONLY, HEADER]
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
