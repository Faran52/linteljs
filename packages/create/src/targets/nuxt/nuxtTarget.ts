import { FOLDER_ROUTED, PARTS } from '../constants';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { sfcNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';
import { ACCESSORS as SOURCE_ACCESSORS, COMPONENTS } from '../vue/constants';

import {
  ACCESSORS,
  ALWAYS,
  FROM_VUE,
  SHARED,
} from './constants';

import type { StarterFile, TargetRecord } from '../types';

// A target rather than a mode on `vue`: `docs/DESIGN.md` records why.
export const nuxtTarget: TargetRecord = {
  id: 'nuxt',
  framework: 'nuxt',
  html: false,
  sfcExtension: 'vue',
  // Installed with no counter module yet: the same recorded gap astro, webextension and angular carry on `form`.
  stores: ['pinia', 'tanstack-store'],
  ignores: ['.nuxt/**', '.output/**'],
  naming: sfcNaming('vue'),
  // A dynamic route is `[slug].vue`, so a directory may be one too.
  folderNaming: { 'src/**/': FOLDER_ROUTED },
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
  nuxtProject: true,
  // Vitest runs outside Nuxt's build, so the SFC transform has to be named for it.
  vitestPlugin: {
    imports: ["import vue from '@vitejs/plugin-vue';"],
    calls: ['vue()'],
  },
  // No `paths` of its own, so Nuxt's merged `#shared` and `#server` set survives.
  tsconfig: {
    jsx: 'preserve',
    extends: './.nuxt/tsconfig.app.json',
    // An extending config replaces `include`, and `.nuxt/nuxt.d.ts` holds the `*.vue` module shim.
    include: ['**/*.vue', '.nuxt/nuxt.d.ts'],
    dropsPaths: true,
  },
  starterFiles: [
    ...mockFiles(false),
    ...componentStyles(COMPONENTS),
    // Vue renames two of the four, so each carries its own path.
    ...componentStyleModules('solid', COMPONENTS),
    ...accessorFiles(ACCESSORS, {
      shared: 'vue',
      names: SOURCE_ACCESSORS,
    }),
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
    ...FROM_VUE
      .map((target): StarterFile => {
        return {
          target,
          shared: 'vue',
        };
      }),
    {
      target: 'src/views/HomeView.vue',
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
    ...mockTests(false),
    ...accessorTests(ACCESSORS, {
      shared: 'vue',
      names: SOURCE_ACCESSORS,
    }),
    {
      target: 'src/views/HomeView.test.ts',
      covers: 'src/views/HomeView.vue',
    },
    {
      target: 'src/views/AboutView.test.ts',
      covers: 'src/views/AboutView.vue',
    },
    {
      target: 'src/views/VersionView.test.ts',
      covers: 'src/views/VersionView.vue',
    },
    {
      target: 'src/components/ui/app-mark/AppMark.test.ts',
      covers: 'src/components/ui/app-mark/AppMark.vue',
    },
    {
      target: 'src/components/features/app-header/AppHeader.test.ts',
      covers: 'src/components/features/app-header/AppHeader.vue',
    },
    {
      target: 'src/pages/index.test.ts',
      covers: 'src/pages/index.vue',
    },
    {
      target: 'src/pages/about.test.ts',
      covers: 'src/pages/about.vue',
    },
    {
      target: 'src/pages/version.test.ts',
      covers: 'src/pages/version.vue',
    },
  ],
  // `nuxt prepare` writes `.nuxt/`, so nothing typechecks before it: it is the postinstall.
  build: 'nuxt build',
  extraScripts: {
    dev: 'nuxt dev',
    preview: 'nuxt preview',
    generate: 'nuxt generate',
  },
  typecheck: 'nuxt typecheck',
  prepare: 'nuxt prepare',
  testDevDependencies: PARTS.vue.testDevDependencies,
  dependencies: [
    'nuxt',
    ...PARTS.vue.dependencies,
    'vue-router',
  ],
  // yarn installs no peer the project does not name.
  devDependencies: [
    ...PARTS.vue.devDependencies,
    '@vitejs/plugin-vue',
    'rolldown',
    'vite',
  ],
  // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses without this.
  allowBuilds: [
    'vue-demi',
    'better-sqlite3',
    'esbuild',
  ],
  stateRules: ['vue-reactivity.md'],
};
