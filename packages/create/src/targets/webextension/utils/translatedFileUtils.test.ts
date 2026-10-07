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
  it('writes the translated popup, its resolver, its helpers and the chosen locales once one is chosen', () => {
    const written = writtenUnder(popupI18nFiles(), withLanguages);

    const expected = [
      'src/popup/popup.ts@i18n',
      'src/i18n/i18n.ts@i18n',
      'true:src/i18n/locales/en/common.json@i18n',
      'true:src/i18n/locales/ar/common.json@i18n',
      'true:src/i18n/utils/languageUtils.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English popup otherwise', () => {
    const written = writtenUnder(popupI18nFiles(), english);

    const expected = ['src/popup/popup.ts'];
    expect(written).toEqual(expected);
  });
});

describe('popupI18nTests', () => {
  it('covers the popup, the resolver, the language helpers and the locales once a language is chosen', () => {
    const written = writtenUnder(popupI18nTests(), withLanguages);

    const expected = [
      'src/popup/popup.test.ts@i18n',
      'src/i18n/i18n.test.ts@i18n',
      'true:src/i18n/locales.test.ts@i18n',
      'true:src/i18n/utils/languageUtils.test.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('covers the English popup otherwise', () => {
    const written = writtenUnder(popupI18nTests(), english);

    const expected = ['src/popup/popup.test.ts'];
    expect(written).toEqual(expected);
  });
});
