import { aboutPage } from '../../packages/create/templates/shared/css-sources/AboutPage.ts';
import { appHeader } from '../../packages/create/templates/shared/css-sources/AppHeader.ts';
import { button } from '../../packages/create/templates/shared/css-sources/Button.ts';
import { codeText } from '../../packages/create/templates/shared/css-sources/CodeText.ts';
import { contactPage } from '../../packages/create/templates/shared/css-sources/ContactPage.ts';
import { homePage } from '../../packages/create/templates/shared/css-sources/HomePage.ts';
import { mark } from '../../packages/create/templates/shared/css-sources/Mark.ts';
import { statusPage } from '../../packages/create/templates/shared/css-sources/StatusPage.ts';
import { textInput } from '../../packages/create/templates/shared/css-sources/TextInput.ts';
import { versionPage } from '../../packages/create/templates/shared/css-sources/VersionPage.ts';

import type { Target } from './utils/cssMarkupUtils.ts';

export const TEMPLATES_DIR = 'packages/create/templates';

const DATA_DRAWER = 'data/redux-free/store/react-state/src';

const STORE_DRAWER = 'store/libraries/src';

const FORM_DRAWER = 'form/libraries/src';

export const TARGETS: readonly Target[] = [
  {
    root: 'shells/vite-react',
    attribute: 'className',
    files: [
      { map: button, markup: 'base/src/components/ui/button/Button.tsx' },
      { map: codeText, markup: 'base/src/components/ui/code-text/CodeText.tsx' },
      { map: mark, markup: 'base/src/components/ui/mark/Mark.tsx' },
      { map: statusPage, markup: 'base/src/components/features/status-page/StatusPage.tsx' },
      { map: aboutPage, markup: 'base/src/pages/about/AboutPage.tsx' },
      { map: versionPage, markup: 'base/src/pages/version/VersionPage.tsx' },
      { map: homePage, markup: `${DATA_DRAWER}/pages/home/HomePage.tsx` },
      { map: homePage, markup: `${STORE_DRAWER}/pages/home/HomePage.tsx` },
      { map: contactPage, markup: `${FORM_DRAWER}/pages/contact/ContactPage.tsx` },
      {
        map: appHeader,
        markup: 'router/react-routers/src/components/features/app-header/AppHeader.tsx',
      },
      { map: appHeader, markup: 'router/single-page/src/components/features/app-header/AppHeader.tsx' },
      { map: appHeader, markup: 'router/tanstack-router/src/components/features/app-header/AppHeader.tsx' },
    ],
  },
  {
    root: 'shells/next',
    attribute: 'className',
    files: [
      { map: button, markup: 'base/src/components/ui/button/Button.tsx' },
      { map: codeText, markup: 'base/src/components/ui/code-text/CodeText.tsx' },
      { map: mark, markup: 'base/src/components/ui/mark/Mark.tsx' },
      { map: statusPage, markup: 'base/src/components/features/status-page/StatusPage.tsx' },
      { map: appHeader, markup: 'base/src/components/features/app-header/AppHeader.tsx' },
      { map: aboutPage, markup: 'base/src/app/about/page.tsx' },
      { map: versionPage, markup: 'base/src/app/version/page.tsx' },
      { map: homePage, markup: `${DATA_DRAWER}/app/page.tsx` },
      { map: homePage, markup: `${STORE_DRAWER}/app/page.tsx` },
      { map: contactPage, markup: `${FORM_DRAWER}/app/contact/page.tsx` },
    ],
  },
  {
    root: 'ui/react-dom',
    attribute: 'className',
    files: [{ map: textInput, markup: 'base/src/components/ui/text-input/TextInput.tsx' }],
  },
];
