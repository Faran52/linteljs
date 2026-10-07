import { hasI18n } from '../../utils/gateUtils';
import { i18nFiles, translated } from '../../utils/i18nUtils';
import { stylexDocument } from '../../utils/styleUtils';
import { TRANSLATED } from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const INDEX = 'src/i18n/index';

const I18N_ONLY_FILES = [`${INDEX}.ts`, 'src/components/ui/code-text/CodeText.astro'];

// What i18n rewrites in the Astro starter, each as the pair `translated` makes.
export const astroI18nFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    ...stylexDocument('src/layouts/Layout.astro')
      .flatMap((file) => {
        return translated(file);
      }),
    ...i18nFiles({
      translated: TRANSLATED,
      only: I18N_ONLY_FILES,
    }),
  ];

  return files;
};

export const astroI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    {
      target: `${INDEX}.test.ts`,
      covers: `${INDEX}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
