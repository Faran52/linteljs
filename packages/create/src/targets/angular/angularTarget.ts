import { DECLARATION_KEY, FOLDER } from '../constants';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { componentStyles } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  SHARED,
} from './constants';

import type { StarterFile, TargetRecord } from '../types';

export const angularTarget: TargetRecord = {
  id: 'angular',
  angularProject: true,
  framework: 'angular',
  html: false,
  // SignalStore over classic @ngrx/store; measurements in docs/DESIGN.md.
  stores: ['ngrx-signals', 'ngrx-store'],
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
  // `fetchExtendedUtils.ts` is one shared asset across ten targets; the alias bridges Angular's kebab spelling.
  extraAliases: { '@utils/fetchExtendedUtils': './src/lib/utils/fetch-extended-utils.ts' },
  styleEntry: 'src/styles.css',
  starterStyles: [
    './styles/tokens.css',
    './styles/base.css',
    './components/features/app-header/AppHeader.css',
    './components/ui/mark/Mark.css',
    {
      path: './components/ui/button/Button.css',
      when: (answers) => {
        return answers.store !== undefined || answers.form !== undefined;
      },
    },
    {
      path: './components/ui/text-input/TextInput.css',
      when: (answers) => {
        return answers.form !== undefined;
      },
    },
  ],
  tailwindTheme: './styles/theme.css',
  tsconfig: {
    useDefineForClassFields: false,
    dropsErasableSyntaxOnly: true,
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
    ...componentStyles(),
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
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
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
    ...accessorTests(ACCESSORS),
    {
      target: 'src/app/app.spec.ts',
      covers: 'src/app/app.ts',
    },
  ],
  typecheck: 'tsc --noEmit',
  // `ng test` is declined: this standard's runner is vitest.
  build: 'ng build',
  extraScripts: { dev: 'ng serve' },
  devDependencies: ['angular-eslint', '@angular/cli', '@angular/build', '@angular/compiler-cli'],
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
  allowBuilds: ['@parcel/watcher', 'esbuild', 'lmdb', 'msgpackr-extract'],
  stateRules: [],
  testSetup: 'fragments/test-setup/setupTests.angular.ts',
};
