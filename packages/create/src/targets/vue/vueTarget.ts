import { hasLibrary } from '@utils/answerUtils';

import { FOLDER, PARTS } from '../constants';
import {
  hasForm,
  hasStore,
  pressable,
} from '../utils/gateUtils';
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
} from './constants';

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
  publicDirectory: 'public',
  styleEntry: 'src/styles/main.css',
  starterStyles: [
    '../styles/tokens.css',
    '../styles/base.css',
    '../components/features/app-header/AppHeader.css',
    '../components/ui/app-mark/AppMark.css',
    {
      path: '../components/ui/app-button/AppButton.css',
      when: (answers) => {
        return answers.store !== undefined || answers.form !== undefined;
      },
    },
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
    {
      target: 'src/components/ui/app-button/AppButton.vue',
      when: pressable,
    },
    ...([
      'src/views/ContactView.vue',
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
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/api.ts',
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
      target: 'src/lib/providers/installStore.ts',
      when: (answers) => {
        return answers.store !== 'pinia';
      },
    },
    {
      target: 'src/lib/providers/installStore.ts',
      when: (answers) => {
        return answers.store === 'pinia';
      },
      variant: 'pinia',
    },
    ...(['pinia', 'tanstack-store'] as const)
      .map((store): StarterFile => {
        return {
          target: 'src/lib/store/counter.ts',
          when: (answers) => {
            return answers.store === store;
          },
          variant: store,
        };
      }),
    {
      target: 'src/lib/providers/installData.ts',
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
    },
    {
      target: 'src/lib/providers/installData.ts',
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
    ...accessorTests(ACCESSORS),
    {
      target: 'src/App.test.ts',
      covers: 'src/App.vue',
    },
    {
      target: 'src/components/ui/app-button/AppButton.test.ts',
      covers: 'src/components/ui/app-button/AppButton.vue',
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
      target: 'src/lib/apis/contact/api.test.ts',
      covers: 'src/lib/apis/contact/api.ts',
    },
    {
      target: 'src/lib/providers/installStore.test.ts',
      covers: 'src/lib/providers/installStore.ts',
    },
    {
      target: 'src/lib/providers/installData.test.ts',
      covers: 'src/lib/providers/installData.ts',
    },
    {
      target: 'src/lib/store/counter.test.ts',
      covers: 'src/lib/store/counter.ts',
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
};
