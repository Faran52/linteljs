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

describe('reactI18nFiles', () => {
  it('writes the translated starter once a language is chosen', () => {
    const written = writtenUnder(reactI18nFiles(), answersFor({ languages: ['ar'] }));

    expect(written).toEqual([
      'src/main.tsx@i18n',
      'src/config/statuses.ts@i18n',
      'src/components/features/status-page/StatusPage.tsx@i18n',
      'src/components/features/app-header/AppHeader.tsx@i18n',
      'src/i18n/index.ts@i18n',
    ]);
  });

  it('writes the English starter otherwise, and neither entry nor header where a router owns them', () => {
    const english = writtenUnder(reactI18nFiles(), answersFor({}));
    const framework = writtenUnder(reactI18nFiles(), answersFor({ router: 'react-router-framework' }));

    expect(english).toEqual([
      'src/main.tsx',
      'src/config/statuses.ts',
      'src/components/features/status-page/StatusPage.tsx',
      'src/components/features/app-header/AppHeader.tsx',
    ]);
    expect(framework).toEqual(['src/config/statuses.ts', 'src/components/features/status-page/StatusPage.tsx']);
  });
});

describe('reactI18nTests', () => {
  it('covers the translated starter, and the header only without a router', () => {
    const translated = writtenUnder(reactI18nTests(), answersFor({ languages: ['ar'] }));
    const routed = writtenUnder(reactI18nTests(), answersFor({ router: 'react-router' }));

    expect(translated).toEqual([
      'src/components/features/status-page/StatusPage.test.tsx@i18n',
      'src/components/features/app-header/AppHeader.test.tsx@i18n',
      'src/i18n/index.test.ts@i18n',
    ]);
    expect(routed).toEqual(['src/components/features/status-page/StatusPage.test.tsx']);
  });
});
