import { answersFor } from '@mocks/answersFor';

import { solidI18nFiles, solidI18nTests } from './translatedFileUtils';

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
  'src/index.tsx',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/components/features/status-page/StatusPage.tsx',
];

describe('solidI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its switcher and code text', () => {
    const written = writtenUnder(solidI18nFiles(), answersFor({
      target: 'solid',
      languages: ['ar'],
    }));

    const expected = [
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.tsx@i18n',
      'src/components/ui/code-text/CodeText.tsx@i18n',
      'src/i18n/index.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(solidI18nFiles(), answersFor({ target: 'solid' }));

    expect(written).toEqual(ENGLISH_FILES);
  });

  it('translates the contact page only beside a form', () => {
    const contactOf = (answers: Answers): string[] => {
      const starterFiles = solidI18nFiles();
      const contact = writtenUnder(starterFiles, answers)
        .filter((file) => {
          return file.startsWith('src/pages/contact/');
        });

      return contact;
    };

    const english = contactOf(answersFor({
      target: 'solid',
      form: 'tanstack-form',
    }));
    const translated = contactOf(answersFor({
      target: 'solid',
      form: 'tanstack-form',
      languages: ['ko'],
    }));
    const formless = contactOf(answersFor({
      target: 'solid',
      languages: ['ko'],
    }));

    const expected = ['src/pages/contact/ContactPage.tsx'];
    expect(english).toEqual(expected);
    const translatedContact = ['src/pages/contact/ContactPage.tsx@i18n'];
    expect(translated).toEqual(translatedContact);
    expect(formless).toEqual([]);
  });
});

describe('solidI18nTests', () => {
  it('covers the translated starter', () => {
    const tests = solidI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'solid',
      languages: ['ar'],
    }));
    const covers = tests
      .map((test) => {
        return test.covers;
      });

    const expected = [
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
      'src/components/ui/code-text/CodeText.test.tsx@i18n',
      'src/components/features/app-header/AppHeader.test.tsx@i18n',
      'src/i18n/index.test.ts@i18n',
    ];
    expect(written).toEqual(expected);

    const coveredFiles = [
      'src/components/features/language-select/LanguageSelect.tsx',
      'src/components/ui/code-text/CodeText.tsx',
      'src/components/features/app-header/AppHeader.tsx',
      'src/i18n/index.ts',
    ];
    expect(covers).toEqual(coveredFiles);
  });

  it('adds no suite otherwise', () => {
    const written = writtenUnder(solidI18nTests(), answersFor({ target: 'solid' }));

    expect(written).toEqual([]);
  });
});
