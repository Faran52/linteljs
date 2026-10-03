import { hasLibrary } from '@utils/answerUtils';

import { DECLARATION_KEY, FOLDER } from '../constants';
import {
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
import { filesAt } from '../utils/starterUtils';
import { tailwindThemeFile } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  ANGULAR_I18N,
  CONTACT_PAGE_FILES,
  SHARED,
} from './constants';
import { angularI18nFiles, angularI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type { StarterFile, TargetRecord } from '../types';

export const angularTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'angular',
    angularProject: true,
    framework: 'angular',
    html: false,
    stores: ['ngrx-signals'],
    ignores: ['.angular/**'],
    // No `--file-name-style-guide`: pinning affects initial files only (measured with `2016`).
    naming: {
      // `check-file` applies every matching key, so two on one name must agree.
      'src/**/!(*.d).ts': 'KEBAB_CASE',
      // `src/` only: the shipped `scripts/utils/` stays camelCase on every target.
      'src/**/utils/*.ts': '*-utils',
      ...DECLARATION_KEY,
    },
    folderNaming: { 'src/**/': FOLDER },
    // `vmThreads`, which Angular's Vite plugin sets, has no Node globals; `testPool` on `types.ts` carries why.
    testPool: 'forks',
    // Shared assets named in camelCase everywhere else; the aliases bridge Angular's kebab spelling for their suites.
    extraAliases: {
      '@utils/fetchExtendedUtils': './src/lib/utils/fetch-extended-utils.ts',
      '@utils/statusUtils': './src/lib/utils/status-utils.ts',
    },
    styleEntry: 'src/styles.css',
    starterStyles: [
      './styles/tokens.css',
      './styles/base.css',
      './components/features/app-header/AppHeader.css',
      './components/ui/mark/Mark.css',
      './components/ui/button/Button.css',
      './components/ui/text-input/TextInput.css',
    ],
    tailwindTheme: './styles/theme.css',
    tsconfig: {
      useDefineForClassFields: false,
      dropsNoEmit: true,
    },
    // Vitest cannot read a decorator; the plugin defaults to `tsconfig.spec.json`.
    vitestPlugin: {
      imports: ["import angular from '@analogjs/vite-plugin-angular';"],
      calls: ["angular({ tsconfig: './tsconfig.json' })"],
    },
    // Declarations with no branch; `ng new` already ships the component spec.
    coverageExclude: ['src/app/app.config.ts', 'src/app/app.routes.ts'],
    publicDirectory: 'public',
    starterFiles: [
      ...mockFiles(false, true, 'src/lib/utils/fetch-extended-utils.ts'),
      {
        target: 'src/lib/utils/status-utils.ts',
        source: 'src/lib/utils/statusUtils.ts',
        shared: true,
      },
      {
        target: 'src/lib/apis/contact/contact-api.ts',
        source: 'src/lib/apis/contact/contactApi.ts',
        shared: true,
      },
      ...accessorFiles(ACCESSORS),
      ...angularI18nFiles(),
      ...localeFiles(),
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      {
        target: 'src/config/routes.ts',
        variant: 'with-form',
        shared: true,
      },
      // Reactive Forms ship with Angular, so the Contact page does too; TanStack Form swaps its component.
      ...CONTACT_PAGE_FILES
        .flatMap((target): StarterFile[] => {
          const variants: StarterFile[] = [
            ...translated<StarterFile>({
              target,
              when: (answers) => {
                return answers.form === undefined;
              },
            }),
            ...translated<StarterFile>({
              target,
              when: (answers) => {
                return answers.form === 'tanstack-form';
              },
              variant: 'tanstack-form',
            }),
          ];

          return variants;
        }),
      {
        target: 'src/lib/apis/contact/schemas.ts',
        when: (answers) => {
          return !hasLibrary(answers, 'zod');
        },
        shared: true,
      },
      {
        target: 'src/lib/apis/contact/schemas.ts',
        when: (answers) => {
          return hasLibrary(answers, 'zod');
        },
        variant: 'zod',
        shared: true,
      },
      tailwindThemeFile(),
      // The Angular builder runs Tailwind 4 only through a PostCSS config, and reads JSON alone.
      {
        target: '.postcssrc.json',
        when: (answers) => {
          return answers.styling === 'tailwind';
        },
        variant: 'tailwind',
      },
    ],
    // The header is outside the outlet, so opening each route covers the shell and every page.
    starterTests: [
      ...mockTests(false, 'src/lib/utils/fetch-extended-utils'),
      {
        target: 'src/lib/utils/status-utils.spec.ts',
        covers: 'src/lib/utils/status-utils.ts',
        source: 'src/lib/utils/statusUtils.test.ts',
        shared: true,
      },
      ...accessorTests(ACCESSORS),
      ...angularI18nTests(),
      LOCALES_TEST,
      {
        target: 'src/lib/apis/contact/contact-api.spec.ts',
        covers: 'src/lib/apis/contact/contact-api.ts',
      },
      {
        target: 'src/app/app.spec.ts',
        covers: 'src/app/app.ts',
      },
      {
        target: 'src/components/ui/button/button.spec.ts',
        covers: 'src/components/ui/button/button.ts',
      },
      {
        target: 'src/lib/providers/crash-handler/crash-handler.spec.ts',
        covers: 'src/lib/providers/crash-handler/crash-handler.ts',
      },
      {
        target: 'src/components/ui/text-input/text-input.spec.ts',
        covers: 'src/components/ui/text-input/text-input.ts',
      },
    ],
    typecheck: 'tsc --noEmit',
    // `ng test` is declined: this standard's runner is vitest.
    build: 'ng build',
    extraScripts: { dev: 'ng serve' },
    devDependencies: [
      'angular-eslint',
      '@angular/cli',
      '@angular/build',
      '@angular/compiler-cli',
    ],
    dependencies: [
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/router',
      'rxjs',
      'tslib',
    ],
    testDevDependencies: ['@analogjs/vite-plugin-angular'],
    allowBuilds: [
      '@parcel/watcher',
      'esbuild',
      'lmdb',
      'msgpackr-extract',
    ],
    stateRules: [],
    i18n: ANGULAR_I18N,
    testSetup: 'fragments/test-setup/setupTests.angular.ts',
  };

  return record;
};
