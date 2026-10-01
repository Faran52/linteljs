import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { I18N_ONLY, TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

// What i18n rewrites in the Svelte starter, each as the pair `translated` makes.
export const svelteI18nFiles = (): StarterFile[] => {
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
      target: 'src/routes/contact/+page.svelte',
      when: hasForm,
    }),
    ...[
      ...I18N_ONLY
        .map((component) => {
          return `${component}.svelte`;
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

// The layout mounts the header, so its twin proves the language is detected once mounted.
export const svelteI18nTests = (): StarterTest[] => {
  return [
    ...([
      ['src/routes/layout.test.ts', 'src/routes/+layout.svelte'],
      ['src/routes/error.test.ts', 'src/routes/+error.svelte'],
      [
        'src/components/features/status-page/StatusPage.test.ts',
        'src/components/features/status-page/StatusPage.svelte',
      ],
    ] as const)
      .flatMap(([target, covers]) => {
        return translated<StarterTest>({
          target,
          covers,
        });
      }),
    ...I18N_ONLY
      .map((component): StarterTest => {
        return {
          target: `${component}.test.ts`,
          covers: `${component}.svelte`,
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
