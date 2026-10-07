import {
  FOLDER_ROUTED,
  OUTSIDE_TESTS,
  PARTS,
  ROUTER_MOCK,
  STATUS_UTILS_TEST,
  VITE_GITIGNORE,
} from '../constants';
import {
  hasForm,
  hasStore,
} from '../utils/gateUtils';
import {
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
  translated,
} from '../utils/i18nUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  filesAt,
} from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  FORM_FILES,
  SHARED,
  SOLID_I18N,
} from './constants';
import { solidI18nFiles, solidI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

export const solidTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'solid',
    htmlEntry: 'src/main.tsx',
    framework: 'solid',
    html: true,
    stores: ['tanstack-store'],
    ignores: [],
    gitignore: VITE_GITIGNORE,
    naming: componentNaming(),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: { '@primitives/*': './src/lib/primitives/*' },
    routeAlias: { '@router/*': './src/router/*', '@pages/*': './src/pages/*' },
    publicDirectory: 'public',
    styleEntry: 'src/index.css',
    starterStyles: [
      './styles/tokens.css',
      './styles/base.css',
      './components/features/app-header/AppHeader.css',
      './components/ui/mark/Mark.css',
      './components/ui/button/Button.css',
      {
        path: './components/ui/text-input/TextInput.css',
        when: hasForm,
      },
    ],
    tailwindTheme: './styles/theme.css',
    vitePlugin: {
      imports: ["import solid from 'vite-plugin-solid';"],
      calls: [`solid({ hot: ${OUTSIDE_TESTS} })`],
    },
    tsconfig: {
      jsx: 'preserve',
      jsxImportSource: 'solid-js',
    },
    // Without these, vitest resolves the server build and a rendered component has no reactive owner.
    testConditions: ['development', 'browser'],
    starterFiles: [
      ...mockFiles(true),
      ...componentStyles(),
      ...componentStyleModules('solid'),
      ...accessorFiles(ACCESSORS),
      ...solidI18nFiles(),
      ...localeFiles(hasForm),
      languageUtilsFile(),
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      ...translated<StarterFile>({
        target: 'src/pages/home/HomePage.tsx',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterFile>({
        target: 'src/pages/home/HomePage.tsx',
        when: hasStore,
        variant: 'with-store',
      }),
      {
        target: 'src/components/ui/index.ts',
        when: (answers) => {
          return !hasForm(answers);
        },
        shared: true,
      },
      { target: 'src/components/ui/button/Button.tsx' },
      ...filesAt(FORM_FILES, {
        when: hasForm,
      }),
      // Solid's `createX` naming keeps its wrapper and barrel off the shared `useSubmitContact`.
      ...contactApiFiles({
        shared: 'solid',
        barrel: 'solid',
      }),
      ...contactFormFiles(),
      {
        target: 'src/components/ui/index.ts',
        when: hasForm,
        variant: 'with-form',
        shared: true,
      },
      {
        target: 'src/router/router.tsx',
        when: (answers) => {
          return !hasForm(answers);
        },
      },
      {
        target: 'src/router/router.tsx',
        when: hasForm,
        variant: 'with-form',
      },
      {
        target: 'src/lib/store/counter/counterStore.ts',
        when: hasStore,
        variant: 'tanstack-store',
      },
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data !== 'tanstack-query';
        },
      },
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
      },
      tailwindThemeFile(),
    ],
    starterTests: [
      ...mockTests(),
      STATUS_UTILS_TEST,
      ...accessorTests(ACCESSORS),
      ...solidI18nTests(),
      LOCALES_TEST,
      languageUtilsTest(),
      {
        target: 'src/App.test.tsx',
        covers: 'src/App.tsx',
      },
      {
        target: 'src/router/router.test.ts',
        covers: 'src/router/router.tsx',
      },
      {
        target: 'src/components/features/status-page/StatusPage.test.tsx',
        covers: 'src/components/features/status-page/StatusPage.tsx',
      },
      {
        target: 'src/components/features/error-boundary/ErrorBoundary.test.tsx',
        covers: 'src/components/features/error-boundary/ErrorBoundary.tsx',
      },
      // Its button is a child of that page and nothing else renders it.
      ...translated<StarterTest>({
        target: 'src/pages/home/HomePage.test.tsx',
        covers: 'src/pages/home/HomePage.tsx',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterTest>({
        target: 'src/pages/home/HomePage.test.tsx',
        covers: 'src/pages/home/HomePage.tsx',
        when: hasStore,
        variant: 'with-store',
      }),
      {
        target: 'src/pages/contact/ContactPage.test.tsx',
        covers: 'src/pages/contact/ContactPage.tsx',
      },
      {
        target: 'src/pages/contact/create-contact-form/createContactForm.test.ts',
        covers: 'src/pages/contact/create-contact-form/createContactForm.ts',
      },
      {
        target: 'src/components/ui/text-input/TextInput.test.tsx',
        covers: 'src/components/ui/text-input/TextInput.tsx',
      },
      {
        target: 'src/lib/apis/contact/contactApi.test.ts',
        covers: 'src/lib/apis/contact/contactApi.ts',
      },
      contactFormTest(),
      {
        target: 'src/components/ui/button/Button.test.tsx',
        covers: 'src/components/ui/button/Button.tsx',
      },
      {
        target: 'src/lib/providers/store/StoreProvider.test.tsx',
        covers: 'src/lib/providers/store/StoreProvider.tsx',
      },
      {
        target: 'src/lib/providers/data/DataProvider.test.tsx',
        covers: 'src/lib/providers/data/DataProvider.tsx',
      },
      {
        target: 'src/lib/store/counter/counterStore.test.ts',
        covers: 'src/lib/store/counter/counterStore.ts',
      },
    ],
    build: 'vite build',
    extraScripts: {
      dev: 'vite',
      preview: 'vite preview',
    },
    typecheck: 'tsc --noEmit',
    testDevDependencies: PARTS.solid.testDevDependencies,
    dependencies: PARTS.solid.dependencies,
    devDependencies: [...PARTS.solid.devDependencies, 'vite'],
    allowBuilds: [],
    stateRules: ['solid-reactivity.md'],
    i18n: SOLID_I18N,
    routerMock: ROUTER_MOCK,
  };

  return record;
};
