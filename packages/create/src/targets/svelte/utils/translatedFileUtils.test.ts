import { answersFor } from '@mocks/answersFor';

import { svelteI18nFiles, svelteI18nTests } from './translatedFileUtils';

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
  'src/routes/about/+page.svelte',
  'src/routes/version/+page.svelte',
  'src/components/features/app-header/AppHeader.svelte',
  'src/components/features/status-page/StatusPage.svelte',
];

const SUITES = [
  'src/routes/layout.test.ts',
  'src/routes/error.test.ts',
  'src/components/features/status-page/StatusPage.test.ts',
];

describe('svelteI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its switcher and code text', () => {
    const written = writtenUnder(svelteI18nFiles(), answersFor({
      target: 'svelte',
      languages: ['ar'],
    }));

    expect(written).toEqual([
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.svelte@i18n',
      'src/components/ui/code-text/CodeText.svelte@i18n',
      'src/i18n/index.ts@i18n',
    ]);
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(svelteI18nFiles(), answersFor({ target: 'svelte' }));

    expect(written).toEqual(ENGLISH_FILES);
  });

  it('translates the contact page only beside a form', () => {
    const contactOf = (answers: Answers): string[] => {
      return writtenUnder(svelteI18nFiles(), answers)
        .filter((file) => {
          return file.startsWith('src/routes/contact/');
        });
    };
    const english = contactOf(answersFor({
      target: 'svelte',
      form: 'tanstack-form',
    }));
    const translated = contactOf(answersFor({
      target: 'svelte',
      form: 'tanstack-form',
      languages: ['ko'],
    }));
    const formless = contactOf(answersFor({
      target: 'svelte',
      languages: ['ko'],
    }));

    expect(english).toEqual(['src/routes/contact/+page.svelte']);
    expect(translated).toEqual(['src/routes/contact/+page.svelte@i18n']);
    expect(formless).toEqual([]);
  });
});

describe('svelteI18nTests', () => {
  it('covers the translated starter', () => {
    const tests = svelteI18nTests();
    const written = writtenUnder(tests, answersFor({
      target: 'svelte',
      languages: ['ar'],
    }));
    const covers = tests
      .map((test) => {
        return test.covers;
      });

    expect(written).toEqual([
      ...SUITES
        .map((suite) => {
          return `${suite}@i18n`;
        }),
      'src/components/features/language-select/LanguageSelect.test.ts@i18n',
      'src/components/ui/code-text/CodeText.test.ts@i18n',
      'src/i18n/index.test.ts@i18n',
    ]);
    expect(covers).toContain('src/routes/+layout.svelte');
    expect(covers).toContain('src/components/ui/code-text/CodeText.svelte');
    expect(covers).toContain('src/i18n/index.ts');
  });

  it('keeps the English suites otherwise', () => {
    const written = writtenUnder(svelteI18nTests(), answersFor({ target: 'svelte' }));

    expect(written).toEqual(SUITES);
  });
});
