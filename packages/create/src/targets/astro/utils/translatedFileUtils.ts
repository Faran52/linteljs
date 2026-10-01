import { hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { stylexDocument } from '../../utils/styleUtils';
import { TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const INDEX = 'src/i18n/index';

// What i18n rewrites in the Astro starter, each as the pair `translated` makes.
export const astroI18nFiles = (): StarterFile[] => {
  return [
    ...stylexDocument('src/layouts/Layout.astro')
      .flatMap((file) => {
        return translated(file);
      }),
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
    ...[`${INDEX}.ts`, 'src/components/ui/code-text/CodeText.astro']
      .map((target): StarterFile => {
        return {
          target,
          when: hasI18n,
          variant: 'i18n',
        };
      }),
  ];
};

// Vitest renders no `.astro` template, so the client script carries the one suite.
export const astroI18nTests = (): StarterTest[] => {
  return [
    {
      target: `${INDEX}.test.ts`,
      covers: `${INDEX}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
  ];
};
