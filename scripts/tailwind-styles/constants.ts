import { aboutPage } from '../../packages/create/templates/codegen/tailwind-sources/AboutPage.ts';
import { appHeader } from '../../packages/create/templates/codegen/tailwind-sources/AppHeader.ts';
import { button } from '../../packages/create/templates/codegen/tailwind-sources/Button.ts';
import { codeText } from '../../packages/create/templates/codegen/tailwind-sources/CodeText.ts';
import { contactPage } from '../../packages/create/templates/codegen/tailwind-sources/ContactPage.ts';
import { homePage } from '../../packages/create/templates/codegen/tailwind-sources/HomePage.ts';
import { mark } from '../../packages/create/templates/codegen/tailwind-sources/Mark.ts';
import { panel } from '../../packages/create/templates/codegen/tailwind-sources/Panel.ts';
import { popup } from '../../packages/create/templates/codegen/tailwind-sources/Popup.ts';
import { statusPage } from '../../packages/create/templates/codegen/tailwind-sources/StatusPage.ts';
import { textInput } from '../../packages/create/templates/codegen/tailwind-sources/TextInput.ts';
import { versionPage } from '../../packages/create/templates/codegen/tailwind-sources/VersionPage.ts';

import type { Target } from './utils/tailwindStylesUtils.ts';

export const TEMPLATES_DIR = 'packages/create/templates';

const HOME_DATA_KEYS = [
  'hero',
  'title',
  'lede',
  'hint',
];

const DATA_DRAWER = 'data/redux-free/store/react-state/styling/tailwind/src';

const STORE_DRAWER = 'store/libraries/styling/tailwind/src';

const FORM_DRAWER = 'form/libraries/styling/tailwind/src';
const ASTRO_FORM_DRAWER = 'form/libraries/hostedFramework/react/styling/tailwind/src';

const ISLAND_DRAWER = 'form/tanstack-form/hostedFramework/non-react-islands/styling/tailwind/src';

export const TARGETS: readonly Target[] = [
  {
    root: 'shells/vite-react',
    attribute: 'className',
    files: [
      {
        table: appHeader,
        path: 'styling/tailwind/src/components/features/app-header/AppHeader.styles.ts',
        style: true,
      },
      { table: button, path: 'styling/tailwind/src/components/ui/button/Button.styles.ts' },
      { table: mark, path: 'styling/tailwind/src/components/ui/mark/Mark.styles.ts' },
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
    root: 'shells/next',
    attribute: 'className',
    files: [
      { table: appHeader, path: 'styling/tailwind/src/components/features/app-header/AppHeader.styles.ts' },
      { table: button, path: 'styling/tailwind/src/components/ui/button/Button.styles.ts' },
      { table: mark, path: 'styling/tailwind/src/components/ui/mark/Mark.styles.ts' },
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
  {
    root: 'shells/astro',
    attribute: 'class',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/views/status/StatusView.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/views/about/AboutView.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/views/version/VersionView.styles.ts' },
      {
        table: homePage,
        path: 'styling/tailwind/src/views/home/HomeView.styles.ts',
        keys: HOME_DATA_KEYS,
      },
      { table: contactPage, path: `${ISLAND_DRAWER}/views/contact/ContactView.styles.ts` },
      {
        table: textInput,
        path: 'hostedFramework/non-react/styling/tailwind/src/components/ui/text-input/TextInput.styles.ts',
      },
    ],
  },
  {
    root: 'shells/astro',
    attribute: 'className',
    files: [{ table: contactPage, path: `${ASTRO_FORM_DRAWER}/views/contact/ContactView.styles.ts` }],
  },
  {
    root: 'ui/react-dom',
    attribute: 'className',
    files: [{ table: textInput, path: 'styling/tailwind/src/components/ui/text-input/TextInput.styles.ts' }],
  },
  {
    root: 'ui/vue',
    attribute: 'class',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: textInput, path: 'styling/tailwind/src/components/ui/text-input/TextInput.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/StatusPage.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/views/about/AboutView.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/views/version/VersionView.styles.ts' },
      { table: contactPage, path: 'form/tanstack-form/styling/tailwind/src/views/contact/ContactView.styles.ts' },
    ],
  },
  {
    root: 'shells/vite-vue',
    attribute: 'class',
    files: [
      {
        table: homePage,
        path: 'store/vue-reactivity/styling/tailwind/src/views/home/HomeView.styles.ts',
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: 'store/libraries/styling/tailwind/src/views/home/HomeView.styles.ts' },
    ],
  },
  {
    root: 'shells/sveltekit',
    attribute: 'class',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: textInput, path: 'styling/tailwind/src/components/ui/text-input/TextInput.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/StatusPage.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/views/about/AboutView.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/views/version/VersionView.styles.ts' },
      { table: contactPage, path: 'form/tanstack-form/styling/tailwind/src/views/contact/ContactView.styles.ts' },
      {
        table: homePage,
        path: 'store/runes/styling/tailwind/src/views/home/HomeView.styles.ts',
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: 'store/tanstack-store/styling/tailwind/src/views/home/HomeView.styles.ts' },
    ],
  },
  {
    root: 'shells/vite-solid',
    attribute: 'class',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/CodeText.styles.ts' },
      { table: textInput, path: 'styling/tailwind/src/components/ui/text-input/TextInput.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/StatusPage.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/pages/about/AboutPage.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/pages/version/VersionPage.styles.ts' },
      { table: contactPage, path: 'form/tanstack-form/styling/tailwind/src/pages/contact/ContactPage.styles.ts' },
      {
        table: homePage,
        path: 'store/signals/styling/tailwind/src/pages/home/HomePage.styles.ts',
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: 'store/tanstack-store/styling/tailwind/src/pages/home/HomePage.styles.ts' },
    ],
  },
  {
    root: 'shells/angular-cli',
    attribute: 'class',
    files: [
      { table: codeText, path: 'styling/tailwind/src/components/ui/code-text/code-text.styles.ts' },
      { table: textInput, path: 'styling/tailwind/src/components/ui/text-input/text-input.styles.ts' },
      { table: statusPage, path: 'styling/tailwind/src/components/features/status-page/status-page.styles.ts' },
      { table: aboutPage, path: 'styling/tailwind/src/app/about/about.styles.ts' },
      { table: versionPage, path: 'styling/tailwind/src/app/version/version.styles.ts' },
      {
        table: homePage,
        path: 'store/signals/styling/tailwind/src/app/home/home.styles.ts',
        keys: HOME_DATA_KEYS,
      },
      { table: homePage, path: 'store/ngrx-signals/styling/tailwind/src/app/home/home.styles.ts' },
      {
        table: contactPage,
        path: 'form/models/styling/tailwind/src/app/contact/contact.styles.ts',
      },
    ],
  },
  {
    root: 'shells/nuxt',
    attribute: 'class',
    files: [
      {
        table: homePage,
        path: 'styling/tailwind/src/views/home/HomeView.styles.ts',
        keys: HOME_DATA_KEYS,
      },
    ],
  },
  {
    root: 'shells/wxt',
    attribute: 'class',
    files: [
      { table: popup, path: 'styling/tailwind/src/popup/popup.styles.ts' },
      { table: panel, path: 'surfaces/devtools-panel/styling/tailwind/src/panel/panel.styles.ts' },
    ],
  },
];
