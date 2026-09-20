import {
  COMMON_REACT_PLUGINS,
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  REACT_VITE_PLUGIN,
} from '../constants';
import { componentNaming } from '../utils/namingUtils';
import { viteScaffold } from '../utils/targetUtils';

import type { Router } from '@answers/target/router/routerAnswer';
import type { StarterFile, TargetRecord } from '../types';

// The only target with a `routers` slot, so it supports every router the vocabulary has.
const ROUTERS: readonly Router[] = ['react-router', 'tanstack-router'];

export const reactTarget: TargetRecord = {
  id: 'react',
  scaffold: viteScaffold('react', true),
  framework: 'react',
  html: true,
  vite: true,
  routeUnit: 'src/pages/<kebab>/{Name}Page.tsx',
  hooksSlot: {
    label: 'Hooks',
    path: 'src/lib/hooks/ (use*)',
  },
  store: {
    label: 'Zustand',
    dependency: 'zustand',
  },
  routers: ROUTERS,
  ignores: [],
  naming: componentNaming(),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: HOOKS_ALIAS,
  styleEntry: 'src/index.css',
  vitePlugin: REACT_VITE_PLUGIN,
  tsconfig: { jsx: 'react-jsx' },
  // A router replaces the scaffolder's `main.tsx` and moves its page under `src/pages/`; `App.tsx` is removed below.
  starterFiles: [
    ...ROUTERS.map((router): StarterFile => {
      return {
        target: 'src/main.tsx',
        router,
      };
    }),
    {
      target: 'src/routes/router.tsx',
      router: 'react-router',
    },
    {
      target: 'src/routes/__root.tsx',
      router: 'tanstack-router',
    },
    {
      target: 'src/routes/index.tsx',
      router: 'tanstack-router',
    },
    {
      target: 'src/routeTree.gen.ts',
      router: 'tanstack-router',
    },
  ],
  starterTests: [{
    target: 'src/App.test.tsx',
    covers: 'src/App.tsx',
  }],
  staleScaffoldFiles: ['tsconfig.app.json', 'tsconfig.node.json'],
  typecheck: 'tsc --noEmit',
  testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
  devDependencies: [
    ...COMMON_REACT_PLUGINS,
    '@vitejs/plugin-react',
    '@rolldown/plugin-babel',
    '@babel/core',
    'babel-plugin-react-compiler',
    'vite',
  ],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMocks: true,
};
