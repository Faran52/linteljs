import { hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';

import type { StarterFile, StarterTest } from '../../types';

const LANGUAGE_SELECT = 'src/components/features/language-select/LanguageSelect';
const STATUS_PAGE = 'src/components/features/status-page/StatusPage';

// What i18n rewrites in the React Native starter, each as the pair `translated` makes.
export const reactNativeI18nFiles = (): StarterFile[] => {
  return [
    ...(['src/config/statuses.ts', 'src/config/standard.ts'] as const)
      .flatMap((target) => {
        return translated<StarterFile>({
          target,
          shared: true,
        });
      }),
    ...[
      'src/app/about.tsx',
      'src/app/version.tsx',
      `${STATUS_PAGE}.tsx`,
    ]
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
    ...['src/i18n/index.ts', `${LANGUAGE_SELECT}.tsx`]
      .map((target): StarterFile => {
        return {
          target,
          when: hasI18n,
          variant: 'i18n',
        };
      }),
  ];
};

export const reactNativeI18nTests = (): StarterTest[] => {
  return [
    ...([
      ['src/app-about.test.tsx', 'src/app/about.tsx'],
      ['src/app-version.test.tsx', 'src/app/version.tsx'],
      ['src/app-not-found.test.tsx', 'src/app/+not-found.tsx'],
      [`${STATUS_PAGE}.test.tsx`, `${STATUS_PAGE}.tsx`],
    ] as const)
      .flatMap(([target, covers]) => {
        return translated<StarterTest>({
          target,
          covers,
        });
      }),
    ...([
      ['src/i18n/index.test.ts', 'src/i18n/index.ts'],
      [`${LANGUAGE_SELECT}.test.tsx`, `${LANGUAGE_SELECT}.tsx`],
    ] as const)
      .map(([target, covers]): StarterTest => {
        return {
          target,
          covers,
          when: hasI18n,
          variant: 'i18n',
        };
      }),
  ];
};
