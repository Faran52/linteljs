import { answersFor } from '@mocks/answersFor';

import { popupI18nFiles, popupI18nTests } from './translatedFileUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../../types';

const writtenUnder = (files: (StarterFile | StarterTest)[], answers: Answers): string[] => {
  return files
    .filter(({ when }) => {
      return when?.(answers) ?? true;
    })
    .map(({
      target,
      variant,
      shared,
    }) => {
      const root = shared === undefined ? '' : `${String(shared)}:`;

      return variant === undefined ? `${root}${target}` : `${root}${target}@${variant}`;
    });
};

const withLanguages = answersFor({
  target: 'webextension',
  languages: ['en', 'ar'],
});
const english = answersFor({ target: 'webextension' });

describe('popupI18nFiles', () => {
  it('writes the translated popup, its resolver and the chosen locales once a language is chosen', () => {
    const written = writtenUnder(popupI18nFiles(), withLanguages);

    expect(written).toEqual([
      'src/popup/renderPopup.ts@i18n',
      'src/i18n/index.ts@i18n',
      'true:src/i18n/locales/en/common.json@i18n',
      'true:src/i18n/locales/ar/common.json@i18n',
    ]);
  });

  it('writes the English popup otherwise', () => {
    const written = writtenUnder(popupI18nFiles(), english);

    expect(written).toEqual(['src/popup/renderPopup.ts']);
  });
});

describe('popupI18nTests', () => {
  it('covers the popup, the resolver and the locales once a language is chosen', () => {
    const written = writtenUnder(popupI18nTests(), withLanguages);

    expect(written).toEqual([
      'src/popup/renderPopup.test.ts@i18n',
      'src/i18n/index.test.ts@i18n',
      'true:src/i18n/locales.test.ts@i18n',
    ]);
  });

  it('covers the English popup otherwise', () => {
    const written = writtenUnder(popupI18nTests(), english);

    expect(written).toEqual(['src/popup/renderPopup.test.ts']);
  });
});
