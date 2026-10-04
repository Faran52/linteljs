import {
  COMMON_REACT_PLUGINS,
  CONTACT_HOOK_FORMS,
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  COUNTER_MODULE_STORES,
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  STATUS_UTILS_TEST,
} from '../constants';
import { REACT_ACCESSORS as SOURCE_ACCESSORS } from '../react/constants';
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
  rtkContactFiles,
  rtkContactTests,
  rtkFiles,
  rtkTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactSchemaFiles,
  filesAt,
  submissionTest,
} from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  CLIENT_BOUNDARIES,
  FROM_REACT,
  NEXT_I18N,
  SHARED,
  STYLEX_CONFIGS,
} from './constants';
import { nextI18nFiles, nextI18nTests } from './utils/translatedFileUtils';

import type { Store } from '@config/types';
import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

const STORES: readonly Store[] = [
  'zustand',
  'redux-toolkit',
  'tanstack-store',
];

const nextStarterTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...mockTests(true),
    STATUS_UTILS_TEST,
    ...accessorTests(ACCESSORS, {
      shared: 'react',
      names: SOURCE_ACCESSORS,
    }),
    ...rtkTests(),
    ...nextI18nTests(),
    LOCALES_TEST,
    languageUtilsTest(),
    COOKIE_UTILS_TEST,
    ...translated<StarterTest>({
      target: 'src/app/page.test.tsx',
      covers: 'src/app/page.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    }),
    ...translated<StarterTest>({
      target: 'src/app/page.test.tsx',
      covers: 'src/app/page.tsx',
      when: hasStore,
      variant: 'with-store',
    }),
    {
      target: 'src/components/ui/mark/Mark.test.tsx',
      covers: 'src/components/ui/mark/Mark.tsx',
      shared: 'react',
    },
    {
      target: 'src/components/ui/button/Button.test.tsx',
      covers: 'src/components/ui/button/Button.tsx',
      shared: 'react',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/providers/store/StoreProvider.test.tsx',
      covers: 'src/lib/providers/store/StoreProvider.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/providers/data/DataProvider.test.tsx',
      covers: 'src/lib/providers/data/DataProvider.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/store/counter/counterStore.test.ts',
      covers: 'src/lib/store/counter/counterStore.ts',
      shared: 'react',
    },
    {
      target: 'src/lib/apis/contact/contactApi.test.ts',
      covers: 'src/lib/apis/contact/contactApi.ts',
      shared: 'react',
    },
    submissionTest(),
    ...rtkContactTests(),
  ];

  return tests;
};

export const nextTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'next',
    framework: 'next',
    // The App Router owns the document.
    html: false,
    stores: STORES,
    ignores: [
      '.next/**',
      'out/**',
      'next-env.d.ts',
    ],
    naming: componentNaming('app'),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: HOOKS_ALIAS,
    extraAliases: {
      '@server/*': './src/lib/server/*',
      '@content/*': './src/content/*',
    },
    styleEntry: 'src/app/globals.css',
    // Next compiles StyleX through Babel and PostCSS; the unplugin is the test run's half.
    stylexBuild: [
      '@stylexjs/babel-plugin',
      '@stylexjs/postcss-plugin',
      'postcss',
      '@stylexjs/unplugin',
      'unplugin',
    ],
    stylexAtRule: true,
    starterStyles: [
      '../styles/tokens.css',
      '../styles/base.css',
      '../components/features/app-header/AppHeader.css',
      '../components/ui/mark/Mark.css',
      '../components/ui/button/Button.css',
      {
        path: '../components/ui/text-input/TextInput.css',
        when: hasForm,
      },
    ],
    tailwindTheme: '../styles/theme.css',
    tsconfig: {
      jsx: 'react-jsx',
      plugins: [{ name: 'next' }],
      // Next rewrites tsconfig.json on every dev boot unless every key it wants is declared.
      include: [
        'next-env.d.ts',
        '.next/types/**/*.ts',
        '.next/dev/types/**/*.ts',
      ],
    },
    // The documents: what each renders is covered where it renders.
    coverageExclude: ['src/app/layout.tsx', 'src/app/global-error.tsx'],
    publicDirectory: 'public',
    clientBoundaries: CLIENT_BOUNDARIES,
    starterFiles: [
      ...mockFiles(true),
      ...componentStyles(),
      ...componentStyleModules('react'),
      ...filesAt(STYLEX_CONFIGS, {
        when: (answers) => {
          return answers.styling === 'stylex';
        },
        variant: 'stylex',
      }),
      {
        target: 'postcss.config.mjs',
        when: (answers) => {
          return answers.styling === 'tailwind';
        },
        variant: 'tailwind',
      },
      ...accessorFiles(ACCESSORS, {
        shared: 'react',
        names: SOURCE_ACCESSORS,
      }),
      ...rtkFiles(),
      ...nextI18nFiles(),
      ...localeFiles(),
      languageUtilsFile(),
      COOKIE_UTILS,
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      ...filesAt(FROM_REACT, {
        shared: 'react',
      }),
      // Next links an `app/icon.svg` itself.
      {
        target: 'src/app/icon.svg',
        shared: true,
        source: 'public/favicon.svg',
      },
      {
        target: 'public/robots.txt',
        shared: true,
      },
      {
        target: 'src/config/routes.ts',
        when: (answers) => {
          return !hasForm(answers);
        },
        shared: true,
      },
      {
        target: 'src/config/routes.ts',
        when: hasForm,
        variant: 'with-form',
        shared: true,
      },
      ...translated<StarterFile>({
        target: 'src/app/page.tsx',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterFile>({
        target: 'src/app/page.tsx',
        when: hasStore,
        variant: 'with-store',
      }),
      {
        target: 'src/components/ui/button/Button.tsx',
        shared: 'react',
      },
      {
        target: 'src/components/ui/index.ts',
        when: (answers) => {
          return !hasForm(answers);
        },
        shared: true,
      },
      {
        target: 'src/components/ui/index.ts',
        when: hasForm,
        variant: 'with-form',
        shared: true,
      },
      ...CONTACT_HOOK_FORMS
        .map((form): StarterFile => {
          const file: StarterFile = {
            target: 'src/app/contact/useContactForm.ts',
            when: (answers) => {
              return answers.form === form;
            },
            variant: form,
            shared: 'react',
            source: 'src/pages/contact/useContactForm.ts',
          };

          return file;
        }),
      {
        target: 'src/components/ui/text-input/TextInput.tsx',
        when: hasForm,
        shared: 'react',
      },
      ...contactApiFiles({
        rtk: true,
        shared: 'react',
      }),
      ...rtkContactFiles(),
      ...contactSchemaFiles(),
      {
        target: 'src/lib/providers/store/StoreProvider.tsx',
        when: (answers) => {
          return answers.store !== 'redux-toolkit';
        },
        shared: 'react',
      },
      {
        target: 'src/lib/providers/store/StoreProvider.tsx',
        when: (answers) => {
          return answers.store === 'redux-toolkit';
        },
        variant: 'redux-toolkit',
        shared: 'react',
      },
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data !== 'tanstack-query';
        },
        shared: 'react',
      },
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
        shared: 'react',
      },
      ...COUNTER_MODULE_STORES
        .map((store): StarterFile => {
          const file: StarterFile = {
            target: 'src/lib/store/counter/counterStore.ts',
            when: (answers) => {
              return answers.store === store;
            },
            variant: store,
            shared: 'react',
          };

          return file;
        }),
      // RTK Query's middleware must be registered in the Redux store.
      {
        target: 'src/lib/store/counter/counterStore.ts',
        when: (answers) => {
          return answers.store === 'redux-toolkit' && answers.data !== 'rtk-query';
        },
        variant: 'redux-toolkit',
        shared: 'react',
      },
      {
        target: 'src/lib/store/counter/counterStore.ts',
        when: (answers) => {
          return answers.store === 'redux-toolkit' && answers.data === 'rtk-query';
        },
        variant: 'rtk-query',
        shared: 'react',
      },
      tailwindThemeFile(),
    ],
    starterTests: nextStarterTests(),
    // `next typegen` first: route types are declared into `.next/types` only after a build.
    typecheck: 'next typegen && tsc --noEmit',
    build: 'next build',
    extraScripts: {
      dev: 'next dev',
      start: 'next start',
    },
    testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
    dependencies: [
      'next',
      'react',
      'react-dom',
    ],
    // Not `eslint-config-next`; `frameworks/next/nextFramework.ts` says why.
    devDependencies: [
      ...COMMON_REACT_PLUGINS,
      '@next/eslint-plugin-next',
      '@types/react',
      '@types/react-dom',
    ],
    // next-intl pulls `@parcel/watcher`, whose install script pnpm refuses without this.
    allowBuilds: ['@parcel/watcher'],
    stateRules: ['react-state.md', 'hooks-order.md'],
    i18n: NEXT_I18N,
    routerMock: 'fragments/test-setup/setupTests.nextRouter.ts',
  };

  return record;
};
