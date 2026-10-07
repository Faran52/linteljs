import {
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  FOLDER,
  PARTS,
  STATUS_UTILS_TEST,
  VITE_GITIGNORE,
  VITE_WORKER_START,
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
import { sfcNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  contactSubmitTests,
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
  COMPONENTS,
  COUNTER_MODULE_STORES,
  FORM_FILES,
  SHARED,
  VUE_I18N,
  VUE_SUITES,
} from './constants';
import { vueI18nFiles, vueI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

export const vueTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'vue',
    htmlEntry: 'src/main.ts',
    workerStart: {
      entries: ['src/main.ts'],
      code: VITE_WORKER_START,
    },
    framework: 'vue',
    html: true,
    sfcExtension: 'vue',
    stores: ['pinia', 'tanstack-store'],
    ignores: [],
    gitignore: VITE_GITIGNORE,
    naming: sfcNaming('vue'),
    folderNaming: { 'src/**/': FOLDER },
    hooksAlias: { '@composables/*': './src/lib/composables/*' },
    routeAlias: { '@router/*': './src/router/*', '@views/*': './src/views/*' },
    publicDirectory: 'public',
    styleEntry: 'src/styles/main.css',
    starterStyles: [
      '../styles/tokens.css',
      '../styles/base.css',
      '../components/features/app-header/AppHeader.css',
      '../components/ui/app-mark/AppMark.css',
      '../components/ui/app-button/AppButton.css',
      {
        path: '../components/ui/text-input/TextInput.css',
        when: hasForm,
      },
    ],
    tailwindTheme: '../styles/theme.css',
    vitePlugin: {
      imports: ["import vue from '@vitejs/plugin-vue';"],
      calls: ['vue()'],
    },
    tsconfig: {
      jsx: 'preserve',
      include: ['**/*.vue'],
    },
    starterFiles: [
      ...mockFiles(hasForm),
      ...componentStyles(COMPONENTS),
      // Vue renames two of the four, so each carries its own path.
      ...componentStyleModules('solid', COMPONENTS),
      ...accessorFiles(ACCESSORS),
      ...vueI18nFiles(),
      ...localeFiles(hasForm),
      languageUtilsFile(),
      COOKIE_UTILS,
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      ...translated<StarterFile>({
        target: 'src/views/home/HomeView.vue',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterFile>({
        target: 'src/views/home/HomeView.vue',
        when: hasStore,
        variant: 'with-store',
      }),
      { target: 'src/components/ui/app-button/AppButton.vue' },
      ...filesAt(FORM_FILES, {
        when: hasForm,
      }),
      ...contactApiFiles(),
      ...contactFormFiles(),
      {
        target: 'src/router/constants.ts',
        when: (answers) => {
          return !hasForm(answers);
        },
      },
      {
        target: 'src/router/constants.ts',
        when: hasForm,
        variant: 'with-form',
      },
      // Vue installs both as app plugins, so each slot is a function rather than a component.
      {
        target: 'src/lib/providers/store/storeProvider.ts',
        when: (answers) => {
          return answers.store !== 'pinia';
        },
      },
      {
        target: 'src/lib/providers/store/storeProvider.ts',
        when: (answers) => {
          return answers.store === 'pinia';
        },
        variant: 'pinia',
      },
      ...COUNTER_MODULE_STORES
        .map((store): StarterFile => {
          const file: StarterFile = {
            target: 'src/lib/store/counter/counterStore.ts',
            when: (answers) => {
              return answers.store === store;
            },
            variant: store,
          };

          return file;
        }),
      {
        target: 'src/lib/providers/data/dataProvider.ts',
        when: (answers) => {
          return answers.data !== 'tanstack-query';
        },
      },
      {
        target: 'src/lib/providers/data/dataProvider.ts',
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
      ...vueI18nTests(),
      LOCALES_TEST,
      languageUtilsTest(),
      COOKIE_UTILS_TEST,
      {
        target: 'src/router/router.test.ts',
        covers: 'src/router/router.ts',
      },
      {
        target: 'src/views/home/HomeView.test.ts',
        covers: 'src/views/home/HomeView.vue',
        when: (answers) => {
          return !hasStore(answers);
        },
      },
      {
        target: 'src/views/home/HomeView.test.ts',
        covers: 'src/views/home/HomeView.vue',
        when: hasStore,
        variant: 'with-store',
      },
      ...VUE_SUITES,
      ...translated<StarterTest>({
        target: 'src/components/features/app-header/AppHeader.test.ts',
        covers: 'src/components/features/app-header/AppHeader.vue',
      }),
      {
        target: 'src/components/ui/app-button/AppButton.test.ts',
        covers: 'src/components/ui/app-button/AppButton.vue',
      },
      {
        target: 'src/components/features/error-boundary/ErrorBoundary.test.ts',
        covers: 'src/components/features/error-boundary/ErrorBoundary.vue',
      },
      {
        target: 'src/views/contact/ContactView.test.ts',
        covers: 'src/views/contact/ContactView.vue',
      },
      {
        target: 'src/views/contact/use-contact-form/useContactForm.test.ts',
        covers: 'src/views/contact/use-contact-form/useContactForm.ts',
      },
      {
        target: 'src/components/ui/text-input/TextInput.test.ts',
        covers: 'src/components/ui/text-input/TextInput.vue',
      },
      {
        target: 'src/lib/apis/contact/contactApi.test.ts',
        covers: 'src/lib/apis/contact/contactApi.ts',
      },
      contactFormTest(),
      ...contactSubmitTests(),
      {
        target: 'src/lib/providers/store/storeProvider.test.ts',
        covers: 'src/lib/providers/store/storeProvider.ts',
      },
      {
        target: 'src/lib/providers/data/dataProvider.test.ts',
        covers: 'src/lib/providers/data/dataProvider.ts',
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
    typecheck: 'vue-tsc --noEmit',
    // The router is unconditional here, so it is a dependency rather than an answer's.
    testDevDependencies: PARTS.vue.testDevDependencies,
    dependencies: [...PARTS.vue.dependencies, 'vue-router'],
    devDependencies: [...PARTS.vue.devDependencies, 'vite'],
    // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses without this.
    allowBuilds: ['vue-demi'],
    stateRules: ['vue-reactivity.md'],
    i18n: VUE_I18N,
  };

  return record;
};
