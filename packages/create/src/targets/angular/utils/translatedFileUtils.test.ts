import { answersFor } from '@mocks/answersFor';

import { angularI18nFiles, angularI18nTests } from './translatedFileUtils';

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

const ENGLISH_FILES = [
  'true:src/config/statuses.ts',
  'true:src/config/standard.ts',
  'src/main.ts',
  'src/app/about/about.ts',
  'src/app/about/about.html',
  'src/app/version/version.ts',
  'src/app/version/version.html',
  'src/components/features/app-header/app-header.ts',
  'src/components/features/app-header/app-header.html',
  'src/components/features/status-page/status-page.ts',
  'src/components/features/status-page/status-page.html',
];

describe('angularI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its code text', () => {
    const written = writtenUnder(angularI18nFiles(), answersFor({
      target: 'angular',
      languages: ['ar'],
    }));

    expect(written).toEqual([
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/i18n/index.ts@i18n',
      'src/components/ui/code-text/code-text.ts@i18n',
      'src/components/ui/code-text/code-text.html@i18n',
    ]);
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(angularI18nFiles(), answersFor({ target: 'angular' }));

    expect(written).toEqual(ENGLISH_FILES);
  });
});

describe('angularI18nTests', () => {
  it('covers the translated starter', () => {
    const tests = angularI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'angular',
      languages: ['ar'],
    }));
    const covers = tests
      .map((test) => {
        return test.covers;
      });

    expect(written).toEqual([
      'src/i18n/index.spec.ts@i18n',
      'src/components/ui/code-text/code-text.spec.ts@i18n',
      'src/components/features/app-header/app-header.spec.ts@i18n',
      'src/app/about/about.spec.ts@i18n',
      'src/app/version/version.spec.ts@i18n',
      'src/app/contact/contact.spec.ts@i18n',
      'src/components/features/status-page/status-page.spec.ts@i18n',
    ]);
    expect(covers).toEqual([
      'src/i18n/index.ts',
      'src/components/ui/code-text/code-text.ts',
      'src/components/features/app-header/app-header.ts',
      'src/app/about/about.ts',
      'src/app/version/version.ts',
      'src/app/contact/contact.ts',
      'src/app/contact/contact.ts',
      'src/components/features/status-page/status-page.ts',
      'src/components/features/status-page/status-page.ts',
    ]);
  });

  it('writes the English contact and status suites otherwise', () => {
    const written = writtenUnder(angularI18nTests(), answersFor({ target: 'angular' }));

    expect(written).toEqual([
      'src/app/contact/contact.spec.ts',
      'src/components/features/status-page/status-page.spec.ts',
    ]);
  });
});
