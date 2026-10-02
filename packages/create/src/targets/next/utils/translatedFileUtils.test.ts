import { answersFor } from '@mocks/answersFor';

import { nextI18nFiles, nextI18nTests } from './translatedFileUtils';

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
  'src/app/layout.tsx',
  'src/app/global-error.tsx',
  'src/app/about/page.tsx',
  'src/app/version/page.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
];

describe('nextI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its provider and switcher', () => {
    const written = writtenUnder(nextI18nFiles(), answersFor({
      target: 'next',
      languages: ['ar'],
    }));

    const expected = [
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.tsx@i18n',
      'src/lib/providers/i18n/I18nProvider.tsx@i18n',
      'src/i18n/index.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(nextI18nFiles(), answersFor({ target: 'next' }));

    expect(written).toEqual(ENGLISH_FILES);
  });

  it('translates the contact page only beside a form', () => {
    const contactOf = (answers: Answers): string[] => {
      return writtenUnder(nextI18nFiles(), answers)
        .filter((file) => {
          return file.startsWith('src/app/contact/');
        });
    };

    const english = contactOf(answersFor({
      target: 'next',
      form: 'tanstack-form',
    }));
    const translated = contactOf(answersFor({
      target: 'next',
      form: 'react-hook-form',
      languages: ['ko'],
    }));
    const formless = contactOf(answersFor({
      target: 'next',
      languages: ['ko'],
    }));

    const expected = ['src/app/contact/page.tsx'];
    expect(english).toEqual(expected);
    const expected2 = ['src/app/contact/page.tsx@i18n'];
    expect(translated).toEqual(expected2);
    expect(formless).toEqual([]);
  });
});

describe('nextI18nTests', () => {
  const SUITES = [
    'src/app/about/page.test.tsx',
    'src/app/version/page.test.tsx',
    'src/app/contact/page.test.tsx',
    'src/app/not-found.test.tsx',
    'src/app/error.test.tsx',
    'src/components/features/app-header/AppHeader.test.tsx',
  ];

  it('covers the translated starter, the status page from its own twin', () => {
    const tests = nextI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'next',
      languages: ['ar'],
    }));
    const covers = tests
      .map((test) => {
        return test.covers;
      });

    const expected = [
      ...SUITES
        .map((suite) => {
          return `${suite}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
      'src/lib/providers/i18n/I18nProvider.test.tsx@i18n',
      'src/components/features/status-page/StatusPage.test.tsx@i18n',
      'src/i18n/index.test.ts@i18n',
    ];
    expect(written).toEqual(expected);

    expect(covers).toContain('src/app/not-found.tsx');
    expect(covers).toContain('src/i18n/index.ts');
  });

  it('keeps the English suites, the status page from React', () => {
    const written = writtenUnder(nextI18nTests(), answersFor({ target: 'next' }));

    const expected = [
      ...SUITES,
      'react:src/components/features/status-page/StatusPage.test.tsx',
    ];
    expect(written).toEqual(expected);
  });
});
