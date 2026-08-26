import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { OUTSIDE_TESTS } from './utils/frameworkUtils';
import { viteScaffold } from './utils/targetUtils';

import type { TargetRecord } from './record';

export const solid: TargetRecord = {
  id: 'solid',
  label: 'Solid',
  scaffold: viteScaffold('solid'),
  framework: 'solid',
  html: true,
  vite: true,
  routeUnit: 'src/pages/<kebab>/{Name}Page.tsx',
  hooksSlot: {
    label: 'Primitives',
    path: 'src/lib/primitives/ (create*)',
  },
  ignores: [],
  naming: NAMING.solid,
  folderNaming: FOLDER_NAMING.solid,
  hooksAlias: { '@primitives/*': './src/lib/primitives/*' },
  styleEntry: 'src/index.css',
  vitePlugin: {
    imports: ["import solid from 'vite-plugin-solid';"],
    calls: [`solid({ hot: ${OUTSIDE_TESTS} })`],
  },
  tsconfig: {
    jsx: 'preserve',
    jsxImportSource: 'solid-js',
  },
  // `solid-js`/`solid-js/web` ship server and client builds behind export conditions; without these, vitest resolves
  // the server build and a rendered component has no reactive owner.
  testConditions: ['development', 'browser'],
  starterTests: [{
    source: 'starter/solid/App.test.tsx',
    target: 'src/App.test.tsx',
    covers: 'src/App.tsx',
  }],
  staleScaffoldFiles: ['tsconfig.app.json', 'tsconfig.node.json'],
  typecheck: 'tsc --noEmit',
  testDevDependencies: ['@solidjs/testing-library'],
  devDependencies: ['eslint-plugin-jsx-a11y', 'eslint-plugin-solid', 'vite-plugin-solid'],
  allowBuilds: [],
  stateRules: ['solid-reactivity.md'],
  routerMocks: true,
};
