import {
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  FOLDER_ROUTED,
  PARTS,
  TRANSLATED_CONFIGS,
} from '../constants';
import {
  hasForm,
  hasI18n,
  hasMsw,
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
  ACCESSORS as SOURCE_ACCESSORS,
  I18N_ONLY,
  VUE_I18N,
  VUE_SUITES,
} from '../vue/constants';

import {
  ACCESSORS,
  ALWAYS,
  COMPONENTS,
  CONTACT_FROM_VUE,
  FORM_FILES,
  FROM_VUE,
  SHARED,
  TRANSLATED_FROM_VUE,
} from './constants';

import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

const I18N_ONLY_FILES = [
  ...I18N_ONLY
    .map((component) => {
      return `${component}.vue`;
    }),
  'src/i18n/i18n.ts',
];

// A target rather than a mode on `vue`: `docs/DESIGN.md` records why.
export const nuxtTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'nuxt',
    framework: 'nuxt',
    html: false,
    sfcExtension: 'vue',
    // Installed with no counter module: Nuxt's starter has no store demo.
    stores: ['pinia', 'tanstack-store'],
    ignores: ['.nuxt/**', '.output/**'],
    gitignore: [
      '.output',
      '.data',
      '.nuxt',
      '.nitro',
      '.cache',
      'dist',
    ],
    naming: sfcNaming('vue'),
    // A dynamic route is `[slug].vue`, so a directory may be one too.
    folderNaming: { 'src/**/': FOLDER_ROUTED },
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
        when: hasForm,
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
    workerEntry: 'src/plugins/msw.client.ts',
    starterFiles: [
      ...mockFiles(hasForm),
      {
        target: 'src/plugins/msw.client.ts',
        when: hasMsw,
      },
      ...componentStyles(COMPONENTS),
      // Vue renames two of the four, so each carries its own path.
      ...componentStyleModules('solid', COMPONENTS),
      ...accessorFiles(ACCESSORS, {
        shared: 'vue',
        names: SOURCE_ACCESSORS,
      }),
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      ...filesAt(FROM_VUE, {
        shared: 'vue',
      }),
      ...TRANSLATED_CONFIGS
        .flatMap((target) => {
          return translated<StarterFile>({
            target,
            shared: true,
          });
        }),
      ...TRANSLATED_FROM_VUE
        .flatMap((target) => {
          return translated<StarterFile>({
            target,
            shared: 'vue',
          });
        }),
      ...translated<StarterFile>({ target: 'src/components/features/app-header/AppHeader.vue' }),
      ...filesAt(I18N_ONLY_FILES, {
        when: hasI18n,
        variant: 'i18n',
        shared: 'vue',
      }),
      {
        target: 'src/plugins/i18n.ts',
        when: hasI18n,
        variant: 'i18n',
      },
      ...translated<StarterFile>({
        target: 'src/views/contact/ContactView.vue',
        when: hasForm,
        shared: 'vue',
      }),
      ...filesAt(['src/pages/contact.vue', 'src/plugins/data.ts'], {
        when: hasForm,
      }),
      ...filesAt(FORM_FILES, {
        when: hasForm,
        shared: 'vue',
      }),
      {
        target: 'src/lib/providers/data/dataProvider.ts',
        when: (answers) => {
          return hasForm(answers) && answers.data !== 'tanstack-query';
        },
        shared: 'vue',
      },
      {
        target: 'src/lib/providers/data/dataProvider.ts',
        when: (answers) => {
          return hasForm(answers) && answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
        shared: 'vue',
      },
      ...contactApiFiles({ query: 'vue' }),
      ...contactFormFiles(),
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
      ...localeFiles(hasForm),
      languageUtilsFile(),
      COOKIE_UTILS,
      ...translated<StarterFile>({ target: 'src/views/home/HomeView.vue' }),
      tailwindThemeFile(),
    ],
    starterTests: [
      ...mockTests(),
      ...accessorTests(ACCESSORS, {
        shared: 'vue',
        names: SOURCE_ACCESSORS,
      }),
      ...translated<StarterTest>({
        target: 'src/views/home/HomeView.test.ts',
        covers: 'src/views/home/HomeView.vue',
      }),
      ...VUE_SUITES
        .map((suite): StarterTest => {
          const shared: StarterTest = {
            ...suite,
            shared: 'vue',
          };

          return shared;
        }),
      ...translated<StarterTest>({
        target: 'src/components/features/app-header/AppHeader.test.ts',
        covers: 'src/components/features/app-header/AppHeader.vue',
      }),
      {
        target: 'src/pages/index.test.ts',
        covers: 'src/pages/index.vue',
      },
      {
        target: 'src/pages/about.test.ts',
        covers: 'src/pages/about.vue',
      },
      {
        target: 'src/pages/contact.test.ts',
        covers: 'src/pages/contact.vue',
      },
      {
        target: 'src/plugins/data.test.ts',
        covers: 'src/plugins/data.ts',
      },
      ...CONTACT_FROM_VUE
        .map((covers): StarterTest => {
          const test: StarterTest = {
            target: covers.replace(/\.\w+/v, '.test.ts'),
            covers,
            shared: 'vue',
          };

          return test;
        }),
      contactFormTest(),
      ...contactSubmitTests(),
      {
        target: 'src/app.test.ts',
        covers: 'src/app.vue',
      },
      ...translated<StarterTest>({
        target: 'src/error.test.ts',
        covers: 'src/error.vue',
      }),
      {
        target: 'src/components/ui/app-button/AppButton.test.ts',
        covers: 'src/components/ui/app-button/AppButton.vue',
        shared: 'vue',
      },
      ...translated<StarterTest>({
        target: 'src/components/features/status-page/StatusPage.test.ts',
        covers: 'src/components/features/status-page/StatusPage.vue',
        shared: 'vue',
      }),
      ...I18N_ONLY
        .map((component): StarterTest => {
          const test: StarterTest = {
            target: `${component}.test.ts`,
            covers: `${component}.vue`,
            when: hasI18n,
            variant: 'i18n',
            shared: 'vue',
          };

          return test;
        }),
      {
        target: 'src/i18n/i18n.test.ts',
        covers: 'src/i18n/i18n.ts',
        when: hasI18n,
        variant: 'i18n',
        shared: 'vue',
      },
      {
        target: 'src/plugins/i18n.test.ts',
        covers: 'src/plugins/i18n.ts',
        when: hasI18n,
        variant: 'i18n',
      },
      LOCALES_TEST,
      languageUtilsTest(),
      COOKIE_UTILS_TEST,
      {
        target: 'src/pages/version.test.ts',
        covers: 'src/pages/version.vue',
      },
    ],
    build: 'nuxt build',
    extraScripts: {
      dev: 'nuxt dev',
      preview: 'nuxt preview',
      generate: 'nuxt generate',
    },
    typecheck: 'nuxt typecheck',
    // `nuxt prepare` writes `.nuxt/`, so nothing typechecks before it: it is the postinstall.
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
    i18n: VUE_I18N,
  };

  return record;
};
