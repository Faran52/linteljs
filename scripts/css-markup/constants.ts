import { aboutPage } from '../../packages/create/templates/codegen/css-sources/AboutPage.ts';
import { appHeader } from '../../packages/create/templates/codegen/css-sources/AppHeader.ts';
import { button } from '../../packages/create/templates/codegen/css-sources/Button.ts';
import { codeText } from '../../packages/create/templates/codegen/css-sources/CodeText.ts';
import { contactPage } from '../../packages/create/templates/codegen/css-sources/ContactPage.ts';
import { homePage } from '../../packages/create/templates/codegen/css-sources/HomePage.ts';
import { mark } from '../../packages/create/templates/codegen/css-sources/Mark.ts';
import { statusPage } from '../../packages/create/templates/codegen/css-sources/StatusPage.ts';
import { textInput } from '../../packages/create/templates/codegen/css-sources/TextInput.ts';
import { versionPage } from '../../packages/create/templates/codegen/css-sources/VersionPage.ts';

import type { Target } from './utils/cssMarkupUtils.ts';

export const TEMPLATES_DIR = 'packages/create/templates';

const DATA_DRAWER = 'data/redux-free/store/react-state/styling/atomic/src';

const STORE_DRAWER = 'store/libraries/styling/atomic/src';

const FORM_DRAWER = 'form/libraries/styling/atomic/src';

const APP_HEADER = 'styling/atomic/src/components/features/app-header/AppHeader.tsx';

export const TARGETS: readonly Target[] = [
  {
    root: 'shells/vite-react',
    attribute: 'className',
    files: [
      { map: statusPage, markup: 'styling/atomic/src/components/features/status-page/StatusPage.tsx' },
      { map: aboutPage, markup: 'styling/atomic/src/pages/about/AboutPage.tsx' },
      { map: versionPage, markup: 'styling/atomic/src/pages/version/VersionPage.tsx' },
      { map: contactPage, markup: `${FORM_DRAWER}/pages/contact/ContactPage.tsx` },
    ],
  },
  {
    root: 'shells/next',
    attribute: 'className',
    files: [
      { map: statusPage, markup: 'styling/atomic/src/components/features/status-page/StatusPage.tsx' },
      { map: appHeader, markup: APP_HEADER },
      { map: aboutPage, markup: 'styling/atomic/src/app/about/page.tsx' },
      { map: versionPage, markup: 'styling/atomic/src/app/version/page.tsx' },
      { map: homePage, markup: `${DATA_DRAWER}/app/page.tsx` },
      { map: homePage, markup: `${STORE_DRAWER}/app/page.tsx` },
      { map: contactPage, markup: `${FORM_DRAWER}/app/contact/page.tsx` },
    ],
  },
  {
    root: 'kit/react',
    attribute: 'className',
    files: [
      { map: button, markup: 'styling/atomic/ui/button/Button.tsx' },
      { map: codeText, markup: 'styling/atomic/ui/code-text/CodeText.tsx' },
      { map: mark, markup: 'styling/atomic/ui/mark/Mark.tsx' },
      { map: textInput, markup: 'styling/atomic/ui/text-input/TextInput.tsx' },
    ],
  },
];
