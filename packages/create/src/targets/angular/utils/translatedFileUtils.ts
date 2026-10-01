import { hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const CODE_TEXT = 'src/components/ui/code-text/code-text';

// What i18n rewrites in the Angular starter, each as the pair `translated` makes.
export const angularI18nFiles = (): StarterFile[] => {
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
    ...[
      'src/i18n/index.ts',
      `${CODE_TEXT}.ts`,
      `${CODE_TEXT}.html`,
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

// `App`'s suite covers the English header; the translated one adds the select, so it takes its own.
export const angularI18nTests = (): StarterTest[] => {
  return [
    'src/i18n/index',
    CODE_TEXT,
    'src/components/features/app-header/app-header',
  ]
    .map((file): StarterTest => {
      return {
        target: `${file}.spec.ts`,
        covers: `${file}.ts`,
        when: hasI18n,
        variant: 'i18n',
      };
    });
};
