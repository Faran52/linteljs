import { ROUTERS } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { REACT_VITE_PLUGIN } from './utils/frameworkUtils';
import {
  COMMON_REACT_PLUGINS,
  HOOKS_ALIAS,
  viteScaffold,
} from './utils/targetUtils';

import type { StarterFile, TargetRecord } from './record';

export const react: TargetRecord = {
  id: 'react',
  label: 'React (Vite)',
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
  naming: NAMING.react,
  folderNaming: FOLDER_NAMING.react,
  hooksAlias: HOOKS_ALIAS,
  styleEntry: 'src/index.css',
  vitePlugin: REACT_VITE_PLUGIN,
  tsconfig: { jsx: 'react-jsx' },
  // A router replaces the scaffolder's `main.tsx` and moves its page under `src/pages/`; `App.tsx` is removed below.
  starterFiles: [
    ...ROUTERS.map((router): StarterFile => {
      return {
        source: `starter/react/${router}/main.tsx`,
        target: 'src/main.tsx',
        router,
      };
    }),
    {
      source: 'starter/react/react-router/router.tsx',
      target: 'src/routes/router.tsx',
      router: 'react-router',
    },
    {
      source: 'starter/react/tanstack-router/__root.tsx',
      target: 'src/routes/__root.tsx',
      router: 'tanstack-router',
    },
    {
      source: 'starter/react/tanstack-router/index.tsx',
      target: 'src/routes/index.tsx',
      router: 'tanstack-router',
    },
    {
      source: 'starter/react/tanstack-router/routeTree.gen.ts',
      target: 'src/routeTree.gen.ts',
      router: 'tanstack-router',
    },
  ],
  starterTests: [{
    source: 'starter/react/App.test.tsx',
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
