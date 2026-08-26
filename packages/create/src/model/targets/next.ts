import { hasLibrary } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { COMMON_REACT_PLUGINS, HOOKS_ALIAS } from './utils/targetUtils';

import type { TargetRecord } from './record';

export const next: TargetRecord = {
  id: 'next',
  label: 'Next.js',
  /**
   * `--src-dir` is load-bearing: every alias resolves under `./src/`, and without it `app/` lands at the repo root,
   * leaving `tsconfig.paths` naming directories that don't exist. The tailwind flag alone follows the answer, since
   * Next wires Tailwind up only at generate time; `--no-eslint`/`--no-agents-md` yield to stage 2's config and
   * lintel's own `CLAUDE.md`.
   */
  scaffold: (name, answers) => {
    return {
      kind: 'create',
      args: [
        'next-app@latest', name,
        '--ts',
        '--no-eslint', '--app', '--src-dir', '--no-agents-md',
        hasLibrary(answers, 'tailwind') ? '--tailwind' : '--no-tailwind',
        '--import-alias', '@/*',
        `--use-${answers.packageManager}`,
        // The install stage runs the same package manager once lintel's dependencies are in package.json; letting the
        // generator install first installs the wrong tree.
        '--skip-install',
        '--yes',
      ],
    };
  },
  framework: 'next',
  // The App Router owns the document: no index.html for the html layer to lint, and enabling it would install the
  // @html-eslint peers for nothing.
  html: false,
  vite: false,
  routeUnit: 'src/app/',
  hooksSlot: {
    label: 'Hooks',
    path: 'src/lib/hooks/ (use*)',
  },
  store: {
    label: 'Zustand',
    dependency: 'zustand',
  },
  ignores: ['.next/**', 'out/**', 'next-env.d.ts'],
  naming: NAMING.next,
  folderNaming: FOLDER_NAMING.next,
  hooksAlias: HOOKS_ALIAS,
  extraAliases: {
    '@server/*': './src/lib/server/*',
    '@content/*': './src/content/*',
  },
  styleEntry: 'src/app/globals.css',
  // No vite config of its own, so nothing to contribute; see the field on `TargetRecord`.
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    jsx: 'react-jsx',
    plugins: [{ name: 'next' }],
    // Next rewrites tsconfig.json on every dev boot unless every key it wants is already declared, so declaring its
    // includes here is what stops it reformatting the file.
    include: ['next-env.d.ts', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
  },
  // The root layout is the document: it renders `<html>` and `<body>` and loads fonts through `next/font`, a bundler
  // loader with no runtime outside Next's build.
  coverageExclude: ['src/app/layout.tsx'],
  starterTests: [{
    source: 'starter/next/page.test.tsx',
    target: 'src/app/page.test.tsx',
    covers: 'src/app/page.tsx',
  }],
  /**
   * `next typegen` runs first: the App Router template's `layout.tsx` is typed `LayoutProps<"/">`, a global Next only
   * declares into `.next/types` after a build, so a bare `tsc --noEmit` on a fresh scaffold fails with `TS2304: Cannot
   * find name 'LayoutProps'`.
   */
  typecheck: 'next typegen && tsc --noEmit',
  testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
  // The plugin alone, not `eslint-config-next`; `frameworks/next.ts` says why.
  devDependencies: [...COMMON_REACT_PLUGINS, '@next/eslint-plugin-next'],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMocks: true,
};
