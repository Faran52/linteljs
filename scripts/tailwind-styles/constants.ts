import { aboutPage } from '../../packages/create/templates/shared/tailwind-sources/AboutPage.ts';
import { codeText } from '../../packages/create/templates/shared/tailwind-sources/CodeText.ts';
import { contactPage } from '../../packages/create/templates/shared/tailwind-sources/ContactPage.ts';
import { homePage } from '../../packages/create/templates/shared/tailwind-sources/HomePage.ts';
import { statusPage } from '../../packages/create/templates/shared/tailwind-sources/StatusPage.ts';
import { versionPage } from '../../packages/create/templates/shared/tailwind-sources/VersionPage.ts';

import type { Target } from './utils/tailwindStylesUtils.ts';

export const SHELLS_DIR = 'packages/create/templates/shells';

const HOME_DATA_KEYS = [
  'hero',
  'title',
  'lede',
  'hint',
];

const DATA_DRAWER = 'data/fetch,tanstack-query/store/react-state/styling/tailwind/src';

const STORE_DRAWER = 'store/redux-toolkit,tanstack-store,zustand/styling/tailwind/src';

const FORM_DRAWER = 'form/react-hook-form,tanstack-form/styling/tailwind/src';

export const TARGETS: readonly Target[] = [
  {
    shell: 'vite-react',
    attribute: 'className',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/StatusPage.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/pages/about/AboutPage.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/pages/version/VersionPage.styles.ts' },
      { table: contactPage, path: `${FORM_DRAWER}/pages/contact/ContactPage.styles.ts` },
      {
        table: homePage,
        path: `${DATA_DRAWER}/pages/home/HomePage.styles.ts`,
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: `${STORE_DRAWER}/pages/home/HomePage.styles.ts` },
    ],
  },
  {
    shell: 'next',
    attribute: 'className',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/StatusPage.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/app/about/page.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/app/version/page.styles.ts' },
      { table: contactPage, path: `${FORM_DRAWER}/app/contact/page.styles.ts` },
      {
        table: homePage,
        path: `${DATA_DRAWER}/app/page.styles.ts`,
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: `${STORE_DRAWER}/app/page.styles.ts` },
    ],
  },
];
