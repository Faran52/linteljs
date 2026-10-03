import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import { ALWAYS_PAGES, CONTACT_PAGE } from '../constants';

import { hasRouter, isFrameworkMode } from './frameworkRouteUtils';

import type { StarterFile, StarterTest } from '../../types';

const HEADER = 'src/components/features/app-header/AppHeader.tsx';
const LANGUAGE_SELECT = 'src/components/features/language-select/LanguageSelect.tsx';

// What i18n rewrites in the React starter, each as the pair `translated` makes.
export const reactI18nFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    // In framework mode React Router's build owns the entry, so a second one would go uncalled.
    ...translated<StarterFile>({
      target: 'src/main.tsx',
      when: (answers) => {
        return !isFrameworkMode(answers);
      },
    }),
    ...translated<StarterFile>({
      target: 'src/config/statuses.ts',
      shared: true,
    }),
    ...translated<StarterFile>({
      target: 'src/config/standard.ts',
      shared: true,
    }),
    ...translated<StarterFile>({ target: 'src/components/features/status-page/StatusPage.tsx' }),
    ...ALWAYS_PAGES
      .flatMap((page) => {
        return translated<StarterFile>({ target: `${page}.tsx` });
      }),
    ...translated<StarterFile>({
      target: `${CONTACT_PAGE}.tsx`,
      when: hasForm,
    }),
    // Without a router the header swaps the page from state, so its tabs are controls; a router's are links.
    ...translated<StarterFile>({
      target: HEADER,
      when: (answers) => {
        return !hasRouter(answers);
      },
    }),
    ...translated<StarterFile>({
      target: HEADER,
      when: (answers) => {
        return answers.router === 'react-router' || isFrameworkMode(answers);
      },
      variant: 'react-router',
    }),
    ...translated<StarterFile>({
      target: HEADER,
      when: (answers) => {
        return answers.router === 'tanstack-router';
      },
      variant: 'tanstack-router',
    }),
    {
      target: LANGUAGE_SELECT,
      when: hasI18n,
      variant: 'i18n',
    },
    {
      target: 'src/i18n/index.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return files;
};

export const reactI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...translated<StarterTest>({
      target: 'src/components/features/status-page/StatusPage.test.tsx',
      covers: 'src/components/features/status-page/StatusPage.tsx',
    }),
    ...ALWAYS_PAGES
      .flatMap((page) => {
        return translated<StarterTest>({
          target: `${page}.test.tsx`,
          covers: `${page}.tsx`,
        });
      }),
    ...translated<StarterTest>({
      target: `${CONTACT_PAGE}.test.tsx`,
      covers: `${CONTACT_PAGE}.tsx`,
      when: hasForm,
    }),
    // `App`'s own suite covers a routed header; standing it alone would need a router context.
    ...translated<StarterTest>({
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: HEADER,
      when: (answers) => {
        return !hasRouter(answers);
      },
    }),
    {
      target: 'src/components/features/language-select/LanguageSelect.test.tsx',
      covers: LANGUAGE_SELECT,
      when: hasI18n,
      variant: 'i18n',
    },
    {
      target: 'src/i18n/index.test.ts',
      covers: 'src/i18n/index.ts',
      when: hasI18n,
      variant: 'i18n',
    },
  ];

  return tests;
};
