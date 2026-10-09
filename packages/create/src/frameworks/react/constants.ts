import type { TsconfigDelta } from '@targets';

export const VITE_SCRIPTS: Record<string, string> = {
  dev: 'vite',
  build: 'vite build',
  preview: 'vite preview',
  typecheck: 'tsc --noEmit',
};

// `typegen` first: a route module's `Route.*` types resolve to what it writes.
export const FRAMEWORK_MODE_TYPECHECK = 'react-router typegen && tsc --noEmit';

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

// Every form drawer writes the `ui` barrel, so it imports as `@ui`.
export const BARRELS = ['src/components/ui/index.ts'];
