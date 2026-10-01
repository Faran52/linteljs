import { answersFor } from '@mocks/answersFor';

import { reactNativeI18nFiles, reactNativeI18nTests } from './translatedFileUtils';

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

const STATUS_PAGE = 'src/components/features/status-page/StatusPage';

const ENGLISH_FILES = [
  'true:src/config/statuses.ts',
  'true:src/config/standard.ts',
  'src/app/about.tsx',
  'src/app/version.tsx',
  `${STATUS_PAGE}.tsx`,
];

const translatedOf = (files: string[]): string[] => {
  return files
    .map((file) => {
      return `${file}@i18n`;
    });
};

const I18N_ONLY = [
  'src/i18n/index.ts@i18n',
  'src/components/features/language-select/LanguageSelect.tsx@i18n',
];

describe('reactNativeI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its language select', () => {
    const written = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      languages: ['ar'],
    }));

    expect(written).toEqual([
      ...translatedOf(ENGLISH_FILES),
      'src/app/_layout.tsx@i18n',
      ...I18N_ONLY,
    ]);
  });

  it('writes the Tailwind layout translated under Tailwind', () => {
    const written = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      styling: 'tailwind',
      languages: ['ar'],
    }));

    expect(written).toEqual([
      ...translatedOf(ENGLISH_FILES),
      'src/app/_layout.tsx@tailwind-i18n',
      ...I18N_ONLY,
    ]);
  });

  it('writes the English starter otherwise, its layout per styling', () => {
    const plain = writtenUnder(reactNativeI18nFiles(), answersFor({ target: 'react-native' }));
    const tailwind = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      styling: 'tailwind',
    }));

    expect(plain).toEqual([...ENGLISH_FILES, 'src/app/_layout.tsx']);
    expect(tailwind).toEqual([...ENGLISH_FILES, 'src/app/_layout.tsx@tailwind']);
  });
});

describe('reactNativeI18nTests', () => {
  const SUITES = [
    'src/app-about.test.tsx',
    'src/app-version.test.tsx',
    'src/app-not-found.test.tsx',
    `${STATUS_PAGE}.test.tsx`,
  ];

  it('covers the translated starter', () => {
    const tests = reactNativeI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'react-native',
      languages: ['ar'],
    }));
    const covers = tests
      .map((test) => {
        return test.covers;
      });

    expect(written).toEqual([
      ...translatedOf(SUITES),
      'src/i18n/index.test.ts@i18n',
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
    ]);

    expect(covers).toEqual([
      'src/app/about.tsx',
      'src/app/about.tsx',
      'src/app/version.tsx',
      'src/app/version.tsx',
      'src/app/+not-found.tsx',
      'src/app/+not-found.tsx',
      `${STATUS_PAGE}.tsx`,
      `${STATUS_PAGE}.tsx`,
      'src/i18n/index.ts',
      'src/components/features/language-select/LanguageSelect.tsx',
    ]);
  });

  it('writes the English suites otherwise', () => {
    const written = writtenUnder(reactNativeI18nTests(), answersFor({ target: 'react-native' }));

    expect(written).toEqual(SUITES);
  });
});
