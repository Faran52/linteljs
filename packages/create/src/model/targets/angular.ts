import { FOLDER_NAMING, NAMING } from '../naming/naming';

import type { TargetRecord } from './record';

export const angular: TargetRecord = {
  id: 'angular',
  label: 'Angular',
  // `--style css` matches what `lint:css` assumes; `--skip-git` avoids a nested repo breaking the hooks.
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
  // SignalStore over classic @ngrx/store; measurements in DESIGN.md.
  store: {
    label: 'NgRx SignalStore',
    dependency: '@ngrx/signals',
  },
  ignores: ['.angular/**'],
  // No `--file-name-style-guide`: pinning affects initial files only, and later `ng generate` writes the current
  // default anyway (measured with `2016`).
  naming: NAMING.angular,
  folderNaming: FOLDER_NAMING.angular,
  styleEntry: 'src/styles.css',
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    useDefineForClassFields: false,
    dropsErasableSyntaxOnly: true,
    dropsNoEmit: true,
  },
  // Both first names are types.
  typeOnlyImports: {
    '@angular/core': ['ApplicationConfig'],
    '@angular/router': ['Routes'],
  },
  // Vitest cannot read a decorator; the tsconfig is named because the plugin defaults to `tsconfig.spec.json`.
  vitestPlugin: {
    imports: ["import angular from '@analogjs/vite-plugin-angular';"],
    calls: ["angular({ tsconfig: './tsconfig.json' })"],
  },
  // Declarations Angular reads at bootstrap, with no branch; `ng new` already ships the component spec.
  coverageExclude: ['src/app/app.config.ts', 'src/app/app.routes.ts'],
  starterFixes: [
    {
      path: 'src/main.ts',
      transform: (source) => {
        // A rejection value is genuinely unknown.
        return source.replace('.catch((err) =>', '.catch((err: unknown) =>');
      },
    },
    {
      // `no-empty-source` has no fixer; the file says what it is for.
      path: 'src/app/app.css',
      transform: (source) => {
        return source.trim() === '' ? '/* Component styles for app-root. */\n' : source;
      },
    },
  ],
  typecheck: 'tsc --noEmit',
  devDependencies: ['angular-eslint'],
  // Only the emitted `vitest.config.ts` calls the compiler plugin.
  testDevDependencies: ['@analogjs/vite-plugin-angular'],
  allowBuilds: ['@parcel/watcher', 'esbuild', 'lmdb', 'msgpackr-extract'],
  // `@angular/build` peers on vitest 4 while the gate runs vitest 5.
  peerAllowances: { '@angular/build>vitest': '5' },
  stateRules: [],
  testSetup: 'mocks/setupTests.angular.ts',
};
