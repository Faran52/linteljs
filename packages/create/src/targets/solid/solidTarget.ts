import { FOLDER_ROUTED, OUTSIDE_TESTS } from '../constants';
import { componentNaming } from '../utils/namingUtils';
import { viteScaffold } from '../utils/targetUtils';

import type { TargetRecord } from '../types';

export const solidTarget: TargetRecord = {
  id: 'solid',
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
  naming: componentNaming(),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
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
  // Without these, vitest resolves the server build and a rendered component has no reactive owner.
  testConditions: ['development', 'browser'],
  starterTests: [{
    target: 'src/App.test.tsx',
    covers: 'src/App.tsx',
  }],
  staleScaffoldFiles: ['tsconfig.app.json', 'tsconfig.node.json'],
  typecheck: 'tsc --noEmit',
  testDevDependencies: ['@solidjs/testing-library'],
  devDependencies: ['eslint-plugin-jsx-a11y-x', 'eslint-plugin-solid', 'vite-plugin-solid', 'vite'],
  allowBuilds: [],
  stateRules: ['solid-reactivity.md'],
  routerMocks: true,
};
