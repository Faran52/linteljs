import { answersFor } from '@mocks/answersFor';

import { vueI18nFiles, vueI18nTests } from './translatedFileUtils';

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
  'src/views/about/AboutView.vue',
  'src/views/version/VersionView.vue',
  'src/components/features/app-header/AppHeader.vue',
  'src/components/features/status-page/StatusPage.vue',
];

const SUITES = [
  'src/App.test.ts',
  'src/components/features/status-page/StatusPage.test.ts',
];

describe('vueI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its switcher and code text', () => {
    const written = writtenUnder(vueI18nFiles(), answersFor({
      target: 'vue',
      languages: ['ar'],
    }));

    const expected = [
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.vue@i18n',
      'src/components/ui/code-text/CodeText.vue@i18n',
      'src/i18n/i18n.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(vueI18nFiles(), answersFor({ target: 'vue' }));

    expect(written).toEqual(ENGLISH_FILES);
  });

  it('translates the contact view only beside a form', () => {
    const contactOf = (answers: Answers): string[] => {
      const starterFiles = vueI18nFiles();
      const contact = writtenUnder(starterFiles, answers)
        .filter((file) => {
          return file.startsWith('src/views/contact/ContactView');
        });

      return contact;
    };

    const english = contactOf(answersFor({
      target: 'vue',
      form: 'tanstack-form',
    }));
    const translated = contactOf(answersFor({
      target: 'vue',
      form: 'tanstack-form',
      languages: ['ko'],
    }));
    const formless = contactOf(answersFor({
      target: 'vue',
      languages: ['ko'],
    }));

    const expected = ['src/views/contact/ContactView.vue'];
    expect(english).toEqual(expected);
    const translatedContact = ['src/views/contact/ContactView.vue@i18n'];
    expect(translated).toEqual(translatedContact);
    expect(formless).toEqual([]);
  });
});

describe('vueI18nTests', () => {
  it('covers the translated starter', () => {
    const tests = vueI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'vue',
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
      'src/components/features/language-select/LanguageSelect.test.ts@i18n',
      'src/components/ui/code-text/CodeText.test.ts@i18n',
      'src/i18n/i18n.test.ts@i18n',
    ];
    expect(written).toEqual(expected);

    expect(covers).toContain('src/App.vue');
    expect(covers).toContain('src/components/ui/code-text/CodeText.vue');
    expect(covers).toContain('src/i18n/i18n.ts');
  });

  it('keeps the English suites otherwise', () => {
    const written = writtenUnder(vueI18nTests(), answersFor({ target: 'vue' }));

    expect(written).toEqual(SUITES);
  });
});
