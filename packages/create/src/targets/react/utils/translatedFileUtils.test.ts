import { answersFor } from '@mocks/answersFor';

import { reactI18nFiles, reactI18nTests } from './translatedFileUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../../types';

const writtenUnder = (files: (StarterFile | StarterTest)[], answers: Answers): string[] => {
  return files
    .filter(({ when }) => {
      return when?.(answers) ?? true;
    })
    .map(({ target, variant }) => {
      return variant === undefined ? target : `${target}@${variant}`;
    });
};

const HEADER = 'src/components/features/app-header/AppHeader.tsx';

describe('reactI18nFiles', () => {
  it('writes the translated starter once a language is chosen', () => {
    const written = writtenUnder(reactI18nFiles(), answersFor({ languages: ['ar'] }));

    const expected = [
      'src/main.tsx@i18n',
      'src/config/statuses.ts@i18n',
      'src/config/standard.ts@i18n',
      'src/components/features/status-page/StatusPage.tsx@i18n',
      'src/pages/about/AboutPage.tsx@i18n',
      'src/pages/version/VersionPage.tsx@i18n',
      `${HEADER}@i18n`,
      'src/components/features/language-select/LanguageSelect.tsx@i18n',
      'src/i18n/index.ts@i18n',
    ];
    expect(written).toEqual(expected);
  });

  it('writes the English starter otherwise, and no entry where React Router owns it', () => {
    const english = writtenUnder(reactI18nFiles(), answersFor({}));
    const framework = writtenUnder(reactI18nFiles(), answersFor({ router: 'react-router-framework' }));

    const expected = [
      'src/main.tsx',
      'src/config/statuses.ts',
      'src/config/standard.ts',
      'src/components/features/status-page/StatusPage.tsx',
      'src/pages/about/AboutPage.tsx',
      'src/pages/version/VersionPage.tsx',
      HEADER,
    ];
    expect(english).toEqual(expected);

    const expected2 = [
      'src/config/statuses.ts',
      'src/config/standard.ts',
      'src/components/features/status-page/StatusPage.tsx',
      'src/pages/about/AboutPage.tsx',
      'src/pages/version/VersionPage.tsx',
      `${HEADER}@react-router`,
    ];
    expect(framework).toEqual(expected2);
  });

  it('translates the contact page and its suite only beside a form', () => {
    const contactOf = (answers: Answers): string[] => {
      return writtenUnder([...reactI18nFiles(), ...reactI18nTests()], answers)
        .filter((file) => {
          return file.startsWith('src/pages/contact/');
        });
    };

    const english = contactOf(answersFor({ form: 'tanstack-form' }));
    const translated = contactOf(answersFor({
      form: 'react-hook-form',
      languages: ['ko'],
    }));
    const formless = contactOf(answersFor({ languages: ['ko'] }));

    const expected = [
      'src/pages/contact/ContactPage.tsx',
      'src/pages/contact/ContactPage.test.tsx',
    ];
    expect(english).toEqual(expected);

    const expected2 = [
      'src/pages/contact/ContactPage.tsx@i18n',
      'src/pages/contact/ContactPage.test.tsx@i18n',
    ];
    expect(translated).toEqual(expected2);

    expect(formless).toEqual([]);
  });

  it.each([
    ['react-router', 'react-router'],
    ['react-router-framework', 'react-router'],
    ['tanstack-router', 'tanstack-router'],
  ] as const)('gives %s the %s header, and its twin once a language is chosen', (router, variant) => {
    const headerOf = (answers: Answers): string[] => {
      return writtenUnder(reactI18nFiles(), answers)
        .filter((file) => {
          return file.startsWith(HEADER);
        });
    };

    const english = headerOf(answersFor({ router }));
    const translated = headerOf(answersFor({
      router,
      languages: ['ja'],
    }));

    const expected = [`${HEADER}@${variant}`];
    expect(english).toEqual(expected);
    const expected2 = [`${HEADER}@${variant}-i18n`];
    expect(translated).toEqual(expected2);
  });
});

describe('reactI18nTests', () => {
  it('covers the translated starter, and the header only without a router', () => {
    const translated = writtenUnder(reactI18nTests(), answersFor({ languages: ['ar'] }));
    const routed = writtenUnder(reactI18nTests(), answersFor({
      router: 'react-router',
      languages: ['ar'],
    }));

    const expected = [
      'src/components/features/status-page/StatusPage.test.tsx@i18n',
      'src/pages/about/AboutPage.test.tsx@i18n',
      'src/pages/version/VersionPage.test.tsx@i18n',
      'src/components/features/app-header/AppHeader.test.tsx@i18n',
      'src/components/features/language-select/LanguageSelect.test.tsx@i18n',
      'src/i18n/index.test.ts@i18n',
    ];
    expect(translated).toEqual(expected);

    expect(routed).not.toContain('src/components/features/app-header/AppHeader.test.tsx@i18n');
  });
});
