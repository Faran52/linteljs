import { answersFor } from '@mocks/answersFor';

import {
  localeFiles,
  LOCALES_TEST,
  translated,
} from './i18nUtils';

import type { StarterFile } from '../types';

const ENGLISH = answersFor({});
const ARABIC = answersFor({ languages: ['ar'] });

const whenOf = (file: StarterFile | undefined): ((answers: typeof ENGLISH) => boolean) => {
  return file?.when ?? (() => {
    return false;
  });
};

describe('translated', () => {
  it('pairs a file with an i18n twin, each written on its own side', () => {
    const [base, twin] = translated<StarterFile>({ target: 'src/a.ts' });

    expect(twin?.variant).toBe('i18n');
    const actual = [whenOf(base)(ENGLISH), whenOf(twin)(ENGLISH)];
    const expected = [true, false];
    expect(actual).toEqual(expected);
    const inArabic = [whenOf(base)(ARABIC), whenOf(twin)(ARABIC)];
    const twinOnly = [false, true];
    expect(inArabic).toEqual(twinOnly);
  });

  it('keeps the file\'s own condition on both sides, and suffixes its variant', () => {
    const [base, twin] = translated<StarterFile>({
      target: 'src/a.ts',
      when: (answers) => {
        return answers.form !== undefined;
      },
      variant: 'with-form',
    });
    const formless = answersFor({ languages: ['ar'] });

    expect(twin?.variant).toBe('with-form-i18n');
    const actual = [whenOf(base)(formless), whenOf(twin)(formless)];
    const expected = [false, false];
    expect(actual).toEqual(expected);
  });
});

describe('localeFiles', () => {
  it('writes English and each chosen locale, and no other', () => {
    const japanese = answersFor({ languages: ['ja'] });
    const written = localeFiles()
      .filter((file) => {
        return whenOf(file)(japanese);
      })
      .map(({ target }) => {
        return target;
      });

    const expected = ['src/i18n/locales/en/common.json', 'src/i18n/locales/ja/common.json'];
    expect(written).toEqual(expected);
  });

  it('reads each from the shared i18n tree', () => {
    const [english] = localeFiles();

    const expected = {
      variant: 'i18n',
      shared: true,
    };
    expect(english).toMatchObject(expected);
  });
});

describe('LOCALES_TEST', () => {
  it('runs only in a translated project', () => {
    const actual = LOCALES_TEST.when?.(ENGLISH);
    expect(actual).toBe(false);
    const inArabic = LOCALES_TEST.when?.(ARABIC);
    expect(inArabic).toBe(true);
  });
});
