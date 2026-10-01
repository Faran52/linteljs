import { hasI18n } from '../../utils/gateUtils';
import {
  localeFiles,
  LOCALES_TEST,
  translated,
} from '../../utils/i18nUtils';

import type { StarterFile, StarterTest } from '../../types';

const POPUP = 'src/popup/renderPopup';
const INDEX = 'src/i18n/index';

// The popup is plain DOM under every host, so it reads the shared locales through a resolver of its own.
export const popupI18nFiles = (): StarterFile[] => {
  return [
    ...translated<StarterFile>({ target: `${POPUP}.ts` }),
    {
      target: `${INDEX}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
    ...localeFiles(),
  ];
};

export const popupI18nTests = (): StarterTest[] => {
  return [
    ...translated<StarterTest>({
      target: `${POPUP}.test.ts`,
      covers: `${POPUP}.ts`,
    }),
    {
      target: `${INDEX}.test.ts`,
      covers: `${INDEX}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
    LOCALES_TEST,
  ];
};
