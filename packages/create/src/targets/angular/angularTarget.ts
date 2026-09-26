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
  /**
   * No `--file-name-style-guide`: pinning affects initial files only, and later `ng generate` writes the current
   * default anyway (measured with `2016`).
   * `ng generate`'s own spelling; `ignoreMiddleExtensions` already reduces `app.spec.ts` to `app`. The declaration
   * key is not optional here either: `customTypes.d.ts` ships with `typeSafety: relaxed` and is not kebab.
   */
  naming: {
    // `!(*.d)`: the declaration key below judges those, and `check-file` applies every key that matches a file, so
    // two of them on one name have to agree. `customTypes.d.ts` ships with `typeSafety: relaxed` and is not kebab.
    'src/**/!(*.d).ts': 'KEBAB_CASE',
    ...DECLARATION_KEY,
  },
  folderNaming: { 'src/**/': FOLDER },
  // `vmThreads`, which Angular's Vite plugin sets, has no Node globals; `testPool` on `types.ts` carries why.
  testPool: 'forks',
  /*
   * The one place Angular's kebab spelling is bridged rather than followed. `fetchExtended.ts` is a shared asset
   * with no framework in it, so it is one file across ten targets, and nine of them spell it in camel; Angular
   * names every source file in kebab and its own lint rule holds it to that. The alias keeps the specifier the
   * same everywhere, so the adapter and its suite stay one asset rather than nine plus a copy.
   */
  extraAliases: { '@utils/fetchExtended': './src/lib/utils/fetch-extended.ts' },
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
  // Vitest cannot read a decorator; the tsconfig is named because the plugin defaults to `tsconfig.spec.json`.
  vitestPlugin: {
    imports: ["import angular from '@analogjs/vite-plugin-angular';"],
    calls: ["angular({ tsconfig: './tsconfig.json' })"],
  },
  // Declarations Angular reads at bootstrap, with no branch; `ng new` already ships the component spec.
  coverageExclude: ['src/app/app.config.ts', 'src/app/app.routes.ts'],
  publicDirectory: 'public',
  starterFiles: [
    // Kebab, because every source file this target writes is: the asset is the same bytes as the other nine.
    ...mockFiles(false, true, 'src/lib/utils/fetch-extended.ts'),
    ...componentStyles(),
    ...accessorFiles(ACCESSORS),
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
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
  ],
  /*
   * One suite, walking the real router: the header is outside the outlet and every page is behind it, so opening
   * each route covers the shell, the header, the mark and all three pages at once.
   */
  starterTests: [
    ...mockTests(false, 'src/lib/utils/fetch-extended'),
    ...accessorTests(ACCESSORS),
    {
      target: 'src/app/app.spec.ts',
      covers: 'src/app/app.ts',
    },
  ],
  typecheck: 'tsc --noEmit',
  // `ng test` is declined, since this standard's runner is vitest.
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
  // Only the emitted `vitest.config.ts` calls the compiler plugin.
  testDevDependencies: ['@analogjs/vite-plugin-angular'],
  allowBuilds: ['@parcel/watcher', 'esbuild', 'lmdb', 'msgpackr-extract'],
  // `@angular/build` peers on vitest 4 while the gate runs vitest 5.
  peerAllowances: { '@angular/build>vitest': '5' },
  stateRules: [],
  testSetup: 'fragments/test-setup/setupTests.angular.ts',
};
