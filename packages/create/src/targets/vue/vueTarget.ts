import { hasLibrary } from '@utils/answerUtils';

import {
  FOLDER,
  PARTS,
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
import { sfcNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  COMPONENTS,
  SHARED,
  VUE_I18N,
} from './constants';
import { vueI18nFiles, vueI18nTests } from './utils/translatedFileUtils';

import type { StarterFile, TargetRecord } from '../types';

export const vueTarget: TargetRecord = {
  id: 'vue',
  htmlEntry: 'src/main.ts',
  framework: 'vue',
  html: true,
  sfcExtension: 'vue',
  stores: ['pinia', 'tanstack-store'],
  ignores: [],
  naming: sfcNaming('vue'),
  folderNaming: { 'src/**/': FOLDER },
  hooksAlias: { '@composables/*': './src/lib/composables/*' },
  routeAlias: { '@views/*': './src/views/*' },
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
      when: (answers) => {
        return answers.form !== undefined;
      },
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
    ...mockFiles(true),
    ...componentStyles(COMPONENTS),
    // Vue renames two of the four, so each carries its own path.
    ...componentStyleModules('solid', COMPONENTS),
    ...accessorFiles(ACCESSORS),
    ...vueI18nFiles(),
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
      target: 'src/views/HomeView.vue',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/views/HomeView.vue',
      when: hasStore,
      variant: 'with-store',
    },
    { target: 'src/components/ui/app-button/AppButton.vue' },
    ...([
      'src/views/useContactForm.ts',
      'src/components/ui/text-input/TextInput.vue',
      'src/components/ui/text-input/types.ts',
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
      target: 'src/views/routes.ts',
      when: (answers) => {
        return !hasForm(answers);
      },
    },
    {
      target: 'src/views/routes.ts',
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
    ...(['pinia', 'tanstack-store'] as const)
      .map((store): StarterFile => {
        return {
          target: 'src/lib/store/counter/counterStore.ts',
          when: (answers) => {
            return answers.store === store;
          },
          variant: store,
        };
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
    {
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ],
  // Mounting `App` walks the real router, so that suite covers the header and every page.
  starterTests: [
    ...mockTests(true),
    STATUS_UTILS_TEST,
    ...accessorTests(ACCESSORS),
    ...vueI18nTests(),
    LOCALES_TEST,
    {
      target: 'src/components/ui/app-button/AppButton.test.ts',
      covers: 'src/components/ui/app-button/AppButton.vue',
    },
    {
      target: 'src/components/features/error-boundary/ErrorBoundary.test.ts',
      covers: 'src/components/features/error-boundary/ErrorBoundary.vue',
    },
    {
      target: 'src/views/ContactView.test.ts',
      covers: 'src/views/ContactView.vue',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.ts',
      covers: 'src/components/ui/text-input/TextInput.vue',
    },
    {
      target: 'src/lib/apis/contact/contactApi.test.ts',
      covers: 'src/lib/apis/contact/contactApi.ts',
    },
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
