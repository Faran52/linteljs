import { FOLDER_NAMING, NAMING } from '../naming/naming';

import type { TargetRecord } from './record';

export const angular: TargetRecord = {
  id: 'angular',
  label: 'Angular',
  // `--defaults` answers the prompts; `--style css` matches what `lint:css` assumes, `--ssr false` keeps the single-
  // page shape, and `--skip-git` avoids a nested repo breaking the husky hooks.
  scaffold: (name, answers) => {
    return {
      kind: 'dlx',
      args: [
        '@angular/cli@latest', 'new', name,
        '--defaults', '--skip-git', '--skip-install',
        '--package-manager', answers.packageManager,
        '--style', 'css',
        '--ssr', 'false',
      ],
    };
  },
  framework: 'angular',
  html: false,
  vite: false,
  routeUnit: 'src/app/',
  // SignalStore over classic @ngrx/store: the decision and its measurements live in DESIGN.md.
  store: {
    label: 'NgRx SignalStore',
    dependency: '@ngrx/signals',
  },
  ignores: ['.angular/**'],
  /**
   * No `--file-name-style-guide` flag: pinning only affects initial files, and `ng generate` later always writes the
   * CLI's current default (measured: pinning `2016` leaves `angular.json`'s `schematics` empty, so later generates
   * write 2025 names into a 2016 project).
   */
  naming: NAMING.angular,
  folderNaming: FOLDER_NAMING.angular,
  styleEntry: 'src/styles.css',
  // No vite config of its own, so nothing to contribute; see the field on `TargetRecord`.
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    useDefineForClassFields: false,
    dropsErasableSyntaxOnly: true,
    dropsNoEmit: true,
  },
  // `ng new` writes `import { ApplicationConfig, provideBrowserGlobalErrorListeners }` in app.config.ts and
  // `import { Routes }` in app.routes.ts. Both first names are types.
  typeOnlyImports: {
    '@angular/core': ['ApplicationConfig'],
    '@angular/router': ['Routes'],
  },
  // Vitest can't read an Angular decorator on its own; this plugin runs the real compiler over the test graph, with the
  // tsconfig named explicitly since the plugin defaults to `tsconfig.spec.json`, which lintel does not own.
  vitestPlugin: {
    imports: ["import angular from '@analogjs/vite-plugin-angular';"],
    calls: ["angular({ tsconfig: './tsconfig.json' })"],
  },
  // A provider array and a route table, both declarations Angular reads at bootstrap: neither has a branch, and
  // `ng new` already ships the spec that covers the component.
  coverageExclude: ['src/app/app.config.ts', 'src/app/app.routes.ts'],
  starterFixes: [
    {
      path: 'src/main.ts',
      transform: (source) => {
        // use-unknown-in-catch-callback-variable: a rejection value is genuinely unknown; typing it says so.
        return source.replace('.catch((err) =>', '.catch((err: unknown) =>');
      },
    },
    {
      // `ng new` writes the component stylesheet empty and `no-empty-source` has no fixer; the file is where component
      // styles go, so it says that rather than being given a rule.
      path: 'src/app/app.css',
      transform: (source) => {
        return source.trim() === '' ? '/* Component styles for app-root. */\n' : source;
      },
    },
  ],
  typecheck: 'tsc --noEmit',
  devDependencies: ['angular-eslint'],
  // The compiler plugin above, which only the emitted `vitest.config.ts` calls: with no testing answer there is no
  // vitest config, so installing it buys a project nothing.
  testDevDependencies: ['@analogjs/vite-plugin-angular'],
  allowBuilds: ['@parcel/watcher', 'esbuild', 'lmdb', 'msgpackr-extract'],
  stateRules: [],
  testSetup: 'mocks/setupTests.angular.ts',
};
