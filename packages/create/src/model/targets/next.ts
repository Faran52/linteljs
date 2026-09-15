import { hasLibrary } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { COMMON_REACT_PLUGINS, HOOKS_ALIAS } from './utils/targetUtils';

import type { TargetRecord } from './record';

export const next: TargetRecord = {
  id: 'next',
  label: 'Next.js',
  // `--src-dir` is load-bearing: every alias resolves under `./src/`. Only the tailwind flag follows an answer,
  // since Next wires Tailwind at generate time.
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
        // The install stage runs after lintel's dependencies land; the generator's install is the wrong tree.
        '--skip-install',
        '--yes',
      ],
    };
  },
  framework: 'next',
  // The App Router owns the document, so there is no index.html to lint.
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
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    jsx: 'react-jsx',
    plugins: [{ name: 'next' }],
    // Next rewrites tsconfig.json on every dev boot unless every key it wants is already declared.
    include: ['next-env.d.ts', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
  },
  // The root layout renders the document and loads fonts through a bundler loader with no runtime outside the build.
  coverageExclude: ['src/app/layout.tsx'],
  starterTests: [{
    source: 'starter/next/page.test.tsx',
    target: 'src/app/page.test.tsx',
    covers: 'src/app/page.tsx',
  }],
  // `next typegen` first: the template's `LayoutProps<"/">` is declared into `.next/types` only after a build.
  typecheck: 'next typegen && tsc --noEmit',
  testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
  // The plugin, not `eslint-config-next`; `frameworks/next.ts` says why.
  devDependencies: [...COMMON_REACT_PLUGINS, '@next/eslint-plugin-next'],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMocks: true,
};
