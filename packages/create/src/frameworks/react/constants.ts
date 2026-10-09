import type { TsconfigDelta } from '@targets';

export const VITE_SCRIPTS: Record<string, string> = {
  dev: 'vite',
  build: 'vite build',
  preview: 'vite preview',
  typecheck: 'tsc --noEmit',
};

// `typegen` first: a route module's `Route.*` types resolve to what it writes.
export const FRAMEWORK_MODE_TYPECHECK = 'react-router typegen && tsc --noEmit';

export const FRAMEWORK_MODE_INSTALL = 'react-router typegen';

// Not msw's own install script: a warm pnpm store replays its cached build, so the worker is never copied.
export const MSW_INSTALL = 'msw init';

export const IGNORES = ['dist/**', 'coverage/**'];

// React Router's CLI owns the build and the document, and only `react()` runs the compiler.
export const FRAMEWORK_MODE_LEAVES = 'oxc-transform-react';

export const VITE_TSCONFIG: TsconfigDelta = { jsx: 'react-jsx' };

export const FRAMEWORK_MODE_TSCONFIG: TsconfigDelta = {
  jsx: 'react-jsx',
  include: ['.react-router/types/**/*'],
  rootDirs: ['.', './.react-router/types'],
};

export const FRAMEWORK_MODE_GITIGNORE = ['/.react-router/', '/build/'];

export const SETUP_TESTS = '__mocks__/setupTests.tsx';

// The document: its parts are covered where each renders.
export const FRAMEWORK_MODE_COVERAGE_EXCLUDE = ['src/root.tsx'];

// React Router's route table is configuration; TanStack Router builds its tree in `App.tsx`.
export const ROUTES_COVERAGE_EXCLUDE = ['src/routes/**'];

// Every form drawer writes the `ui` barrel, so it imports as `@ui`.
export const BARRELS = ['src/components/ui/index.ts'];
