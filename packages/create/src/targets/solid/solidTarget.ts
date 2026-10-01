import { hasLibrary } from '@utils/answerUtils';

import {
  FOLDER_ROUTED,
  OUTSIDE_TESTS,
  PARTS,
  ROUTER_MOCK,
  STATUS_UTILS_TEST,
} from '../constants';
import {
  hasForm,
  hasStore,
} from '../utils/gateUtils';
import { localeFiles, LOCALES_TEST } from '../utils/i18nUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  SHARED,
  SOLID_I18N,
} from './constants';
import { solidI18nFiles, solidI18nTests } from './utils/translatedFileUtils';

import type { StarterFile, TargetRecord } from '../types';

export const solidTarget: TargetRecord = {
  id: 'solid',
  htmlEntry: 'src/index.tsx',
  framework: 'solid',
  html: true,
  stores: ['tanstack-store'],
  ignores: [],
  naming: componentNaming(),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: { '@primitives/*': './src/lib/primitives/*' },
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
      when: (answers) => {
        return answers.form !== undefined;
      },
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
    ...componentStyleModules(),
    ...accessorFiles(ACCESSORS),
    ...solidI18nFiles(),
    ...localeFiles(),
    ...ALWAYS
      .map((target): StarterFile => {
        return { target };
      }),
    ...SHARED
      .map((target): StarterFile => {
        return {
          target,
          shared: true,
        };
      }),
    {
      target: 'src/pages/home/HomePage.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/pages/home/HomePage.tsx',
      when: hasStore,
      variant: 'with-store',
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return !hasForm(answers);
      },
      shared: true,
    },
    { target: 'src/components/ui/button/Button.tsx' },
    ...([
      'src/pages/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: hasForm,
        };
      }),
    {
      target: 'src/lib/apis/contact/index.ts',
      when: hasForm,
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && !hasLibrary(answers, 'zod');
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && hasLibrary(answers, 'zod');
      },
      variant: 'zod',
      shared: true,
    },
    {
      target: 'src/components/ui/index.ts',
      when: hasForm,
      variant: 'with-form',
      shared: true,
    },
    {
      target: 'src/pages/routes.tsx',
      when: (answers) => {
        return !hasForm(answers);
      },
    },
    {
      target: 'src/pages/routes.tsx',
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
    {
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ],
  starterTests: [
    ...mockTests(true),
    STATUS_UTILS_TEST,
    ...accessorTests(ACCESSORS),
    ...solidI18nTests(),
    LOCALES_TEST,
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
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
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
      when: hasStore,
      variant: 'with-store',
    },
    {
      target: 'src/pages/contact/ContactPage.test.tsx',
      covers: 'src/pages/contact/ContactPage.tsx',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
    },
    {
      target: 'src/lib/apis/contact/contactApi.test.ts',
      covers: 'src/lib/apis/contact/contactApi.ts',
    },
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
