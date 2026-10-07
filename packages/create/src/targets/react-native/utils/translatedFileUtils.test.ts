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
  'src/app/(tabs)/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/about.tsx',
  'src/app/(tabs)/version.tsx',
  `${STATUS_PAGE}.tsx`,
];

const translatedOf = (files: string[]): string[] => {
  return files
    .map((file) => {
      return `${file}@i18n`;
    });
};

const I18N_ONLY = [
  'src/i18n/i18n.ts@i18n',
  'src/components/features/language-select/LanguageSelect.tsx@i18n',
];

describe('reactNativeI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its language select', () => {
    const written = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      languages: ['ar'],
    }));

    const expected = [
      ...translatedOf(ENGLISH_FILES),
      'src/app/_layout.tsx@i18n',
      ...I18N_ONLY,
    ];
    expect(written).toEqual(expected);
  });

  it('writes the Tailwind layout translated under Tailwind', () => {
    const written = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      styling: 'tailwind',
      languages: ['ar'],
    }));

    const expected = [
      ...translatedOf(ENGLISH_FILES),
      'src/app/_layout.tsx@tailwind-i18n',
      ...I18N_ONLY,
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English starter otherwise, its layout per styling', () => {
    const plain = writtenUnder(reactNativeI18nFiles(), answersFor({ target: 'react-native' }));
    const tailwind = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      styling: 'tailwind',
    }));

    const expected = [...ENGLISH_FILES, 'src/app/_layout.tsx'];
    expect(plain).toEqual(expected);
    const tailwindFiles = [...ENGLISH_FILES, 'src/app/_layout.tsx@tailwind'];
    expect(tailwind).toEqual(tailwindFiles);
  });

  it('writes the contact screen once a form library is chosen, translated under i18n', () => {
    const english = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      form: 'tanstack-form',
    }));
    const translated = writtenUnder(reactNativeI18nFiles(), answersFor({
      target: 'react-native',
      form: 'react-hook-form',
      languages: ['ar'],
    }));

    const englishFiles = [
      ...ENGLISH_FILES,
      'src/app/_layout.tsx',
      'src/app/(tabs)/contact.tsx',
    ];
    expect(english).toEqual(englishFiles);
    const translatedFiles = [
      ...translatedOf(ENGLISH_FILES),
      'src/app/_layout.tsx@i18n',
      'src/app/(tabs)/contact.tsx@i18n',
      ...I18N_ONLY,
    ];
    expect(translated).toEqual(translatedFiles);
  });
});

describe('reactNativeI18nTests', () => {
  const SUITES = [
    'src/app-tabs-layout.test.tsx',
    'src/app-tabs-index.test.tsx',
    'src/app-tabs-about.test.tsx',
    'src/app-tabs-version.test.tsx',
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

    const expected = [
      ...translatedOf(SUITES),
      'src/i18n/i18n.test.ts@i18n',
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
    ];
    expect(written).toEqual(expected);

    const coveredFiles = [
      'src/app/(tabs)/_layout.tsx',
      'src/app/(tabs)/_layout.tsx',
      'src/app/(tabs)/index.tsx',
      'src/app/(tabs)/index.tsx',
      'src/app/(tabs)/about.tsx',
      'src/app/(tabs)/about.tsx',
      'src/app/(tabs)/version.tsx',
      'src/app/(tabs)/version.tsx',
      'src/app/+not-found.tsx',
      'src/app/+not-found.tsx',
      `${STATUS_PAGE}.tsx`,
      `${STATUS_PAGE}.tsx`,
      'src/app/(tabs)/contact.tsx',
      'src/app/(tabs)/contact.tsx',
      'src/i18n/i18n.ts',
      'src/components/features/language-select/LanguageSelect.tsx',
    ];
    expect(covers).toEqual(coveredFiles);
  });

  it('writes the English suites otherwise', () => {
    const written = writtenUnder(reactNativeI18nTests(), answersFor({ target: 'react-native' }));

    expect(written).toEqual(SUITES);
  });

  it('covers the contact screen once a form library is chosen, translated under i18n', () => {
    const english = writtenUnder(reactNativeI18nTests(), answersFor({
      target: 'react-native',
      form: 'tanstack-form',
    }));
    const translated = writtenUnder(reactNativeI18nTests(), answersFor({
      target: 'react-native',
      form: 'tanstack-form',
      languages: ['ar'],
    }));

    const englishSuites = [...SUITES, 'src/app-tabs-contact.test.tsx'];
    expect(english).toEqual(englishSuites);
    const translatedSuites = [
      ...translatedOf(SUITES),
      'src/app-tabs-contact.test.tsx@i18n',
      'src/i18n/i18n.test.ts@i18n',
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
    ];
    expect(translated).toEqual(translatedSuites);
  });
});
