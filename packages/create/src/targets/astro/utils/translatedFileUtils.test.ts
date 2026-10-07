import { answersFor } from '@mocks/answersFor';

import { astroI18nFiles, astroI18nTests } from './translatedFileUtils';

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
  'src/views/home/HomeView.astro',
  'src/views/about/AboutView.astro',
  'src/views/version/VersionView.astro',
  'src/views/status/StatusView.astro',
  'src/components/features/app-header/AppHeader.astro',
];

const withLanguage = (overrides: Partial<Answers> = {}): Answers => {
  return answersFor({
    target: 'astro',
    languages: ['ar'],
    ...overrides,
  });
};

describe('astroI18nFiles', () => {
  it('writes the translated starter once a language is chosen, with its client script', () => {
    const written = writtenUnder(astroI18nFiles(), withLanguage());

    const expected = [
      'src/layouts/Layout.astro@i18n',
      ...ENGLISH_FILES
        .map((file) => {
          return `${file}@i18n`;
        }),
      'src/i18n/index.ts@i18n',
      'src/components/ui/code-text/CodeText.astro@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('translates the StyleX layout as its own twin', () => {
    const written = writtenUnder(astroI18nFiles(), withLanguage({ styling: 'stylex' }));

    expect(written).toContain('src/layouts/Layout.astro@stylex-i18n');
    expect(written).not.toContain('src/layouts/Layout.astro@i18n');
  });

  it('writes the English starter otherwise', () => {
    const written = writtenUnder(astroI18nFiles(), answersFor({ target: 'astro' }));

    const expected = ['src/layouts/Layout.astro', ...ENGLISH_FILES];
    expect(written).toEqual(expected);
  });
});

describe('astroI18nTests', () => {
  it('covers the client script once a language is chosen, and nothing otherwise', () => {
    const written = writtenUnder(astroI18nTests(), withLanguage());
    const english = writtenUnder(astroI18nTests(), answersFor({ target: 'astro' }));

    const expected = ['src/i18n/index.test.ts@i18n'];
    expect(written).toEqual(expected);
    expect(english).toEqual([]);
  });
});
