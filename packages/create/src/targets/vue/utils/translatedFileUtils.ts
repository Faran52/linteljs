import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { I18N_ONLY, TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the Vue starter, each as the pair `translated` makes.
export const vueI18nFiles = (): StarterFile[] => {
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
      target: 'src/views/ContactView.vue',
      when: hasForm,
    }),
    ...[
      ...I18N_ONLY
        .map((component) => {
          return `${component}.vue`;
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

// Mounting `App` walks every page, so its twin switches each one from the header.
export const vueI18nTests = (): StarterTest[] => {
  return [
    ...(['src/App', 'src/components/features/status-page/StatusPage'] as const)
      .flatMap((suite) => {
        return translated<StarterTest>({
          target: `${suite}.test.ts`,
          covers: `${suite}.vue`,
        });
      }),
    ...I18N_ONLY
      .map((component): StarterTest => {
        return {
          target: `${component}.test.ts`,
          covers: `${component}.vue`,
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
