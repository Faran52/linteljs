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
    expect([whenOf(base)(ENGLISH), whenOf(twin)(ENGLISH)]).toEqual([true, false]);
    expect([whenOf(base)(ARABIC), whenOf(twin)(ARABIC)]).toEqual([false, true]);
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
    expect([whenOf(base)(formless), whenOf(twin)(formless)]).toEqual([false, false]);
  });
});

describe('localeFiles', () => {
  it('writes English and each chosen locale, and no other', () => {
    const written = localeFiles()
      .filter((file) => {
        return whenOf(file)(answersFor({ languages: ['ja'] }));
      })
      .map(({ target }) => {
        return target;
      });

    expect(written).toEqual(['src/i18n/locales/en/common.json', 'src/i18n/locales/ja/common.json']);
  });

  it('reads each from the shared i18n tree', () => {
    const [english] = localeFiles();

    expect(english).toMatchObject({
      variant: 'i18n',
      shared: true,
    });
  });
});

describe('LOCALES_TEST', () => {
  it('runs only in a translated project', () => {
    expect(LOCALES_TEST.when?.(ENGLISH)).toBe(false);
    expect(LOCALES_TEST.when?.(ARABIC)).toBe(true);
  });
});
