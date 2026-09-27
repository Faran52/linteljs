import { hasLibrary } from '@utils/answerUtils';

import {
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  OUTSIDE_TESTS,
  PARTS,
  REACT_VITE_PLUGIN,
  ROUTER_MOCK,
} from '../constants';
import { hasStore } from '../utils/gateUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
  rtkFiles,
  rtkTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ALWAYS,
  DECLARATIVE_ROUTERS,
  REACT_ACCESSORS,
  ROUTERS,
  SHARED,
} from './constants';

import type { Answers } from '@config/types';
import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

// Framework mode moves the build, typecheck, vite plugin and tsconfig, so the record is a function.
const isFrameworkMode = (answers: Answers): boolean => {
  return answers.router === 'react-router-framework';
};

const hasRouter = (answers: Answers): boolean => {
  return answers.router !== undefined;
};

const baseReactTarget: TargetRecord = {
  id: 'react',
  htmlEntry: 'src/main.tsx',
  starterStyles: [
    './styles/tokens.css',
    './styles/base.css',
    './components/features/app-header/AppHeader.css',
    './components/ui/mark/Mark.css',
    {
      path: './components/ui/button/Button.css',
      when: (answers) => {
        return answers.store !== undefined || answers.form !== undefined;
      },
    },
    {
      path: './components/ui/text-input/TextInput.css',
      when: (answers) => {
        return answers.form !== undefined;
      },
    },
  ],
  tailwindTheme: './styles/theme.css',
  framework: 'react',
  html: true,
  stores: ['zustand', 'redux-toolkit', 'tanstack-store'],
  routers: ROUTERS,
  ignores: [],
  naming: componentNaming(),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: HOOKS_ALIAS,
  publicDirectory: 'public',
  styleEntry: 'src/index.css',
  vitePlugin: REACT_VITE_PLUGIN,
  tsconfig: { jsx: 'react-jsx' },
  starterFiles: [
    ...ALWAYS
      .map((target): StarterFile => {
        return { target };
      }),
    ...SHARED
      .map((target): StarterFile => {
        return {
          target,
          shared: true,
        };
      }),
    // So `AppHeader.tsx` varies by router alone, not router times styling.
    ...componentStyleModules(),
    // In framework mode React Router's build owns the entry, so a second one would go uncalled.
    {
      target: 'src/main.tsx',
      when: (answers) => {
        return !isFrameworkMode(answers);
      },
    },
    {
      target: 'src/pages/routes.tsx',
      when: (answers) => {
        return answers.form === undefined;
      },
    },
    {
      target: 'src/pages/routes.tsx',
      when: (answers) => {
        return answers.form !== undefined;
      },
      variant: 'with-form',
    },
    {
      target: 'src/pages/home/HomePage.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/pages/home/HomePage.tsx',
      when: hasStore,
      variant: 'with-store',
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return !hasStore(answers) && answers.form === undefined;
      },
      shared: true,
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return hasStore(answers) && answers.form === undefined;
      },
      variant: 'with-store',
      shared: true,
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return answers.form !== undefined;
      },
      variant: 'with-form',
      shared: true,
    },
    ...([
      'src/pages/contact/ContactPage.tsx',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/index.ts',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: (answers) => {
            return answers.form !== undefined;
          },
        };
      }),
    // RTK Query keeps its own `createApi` rather than a wrapper that would lose its cache.
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return answers.form !== undefined && answers.data === undefined;
      },
    },
    ...(['tanstack-query', 'rtk-query'] as const)
      .map((data): StarterFile => {
        return {
          target: 'src/lib/apis/contact/api.ts',
          when: (answers) => {
            return answers.form !== undefined && answers.data === data;
          },
          variant: data,
        };
      }),
    // TanStack Query needs an ancestor; RTK Query rides the Redux provider.
    {
      target: 'src/lib/providers/DataProvider.tsx',
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
    },
    {
      target: 'src/lib/providers/DataProvider.tsx',
      when: (answers) => {
        return answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return answers.form !== undefined && !hasLibrary(answers, 'zod');
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return answers.form !== undefined && hasLibrary(answers, 'zod');
      },
      variant: 'zod',
      shared: true,
    },
    ...(['tanstack-form', 'react-hook-form'] as const)
      .map((form): StarterFile => {
        return {
          target: 'src/pages/contact/useContactForm.ts',
          when: (answers) => {
            return answers.form === form;
          },
          variant: form,
        };
      }),
    {
      target: 'src/components/ui/button/Button.tsx',
      when: (answers) => {
        return hasStore(answers) || answers.form !== undefined;
      },
    },
    // Without a router the header swaps the page from state, so its tabs are controls.
    {
      target: 'src/components/features/app-header/AppHeader.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    {
      target: 'src/App.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    {
      target: 'src/lib/providers/StoreProvider.tsx',
      when: (answers) => {
        return answers.store !== 'redux-toolkit';
      },
    },
    ...mockFiles(true),
    ...componentStyles(),
    ...rtkFiles(),
    ...accessorFiles(REACT_ACCESSORS),
    {
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
    {
      target: 'src/lib/providers/StoreProvider.tsx',
      when: (answers) => {
        return answers.store === 'redux-toolkit';
      },
      variant: 'redux-toolkit',
    },
    ...(['zustand', 'tanstack-store'] as const)
      .map((store): StarterFile => {
        return {
          target: 'src/lib/store/counter.ts',
          when: (answers) => {
            return answers.store === store;
          },
          variant: store,
        };
      }),
    // RTK Query's middleware must be registered in the Redux store.
    {
      target: 'src/lib/store/counter.ts',
      when: (answers) => {
        return answers.store === 'redux-toolkit' && answers.data !== 'rtk-query';
      },
      variant: 'redux-toolkit',
    },
    {
      target: 'src/lib/store/counter.ts',
      when: (answers) => {
        return answers.store === 'redux-toolkit' && answers.data === 'rtk-query';
      },
      variant: 'rtk-query',
    },
    ...DECLARATIVE_ROUTERS
      .flatMap((router): StarterFile[] => {
        const chosen = (answers: Answers): boolean => {
          return answers.router === router;
        };

        return [
          {
            target: 'src/App.tsx',
            when: chosen,
            variant: router,
          },
          {
            target: 'src/components/features/app-header/AppHeader.tsx',
            when: chosen,
            variant: router,
          },
        ];
      }),
    ...([
      'src/routes/router.tsx',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: (answers) => {
            return answers.router === 'react-router';
          },
          variant: 'react-router',
        };
      }),
    // No `App.tsx` or `main.tsx`: `root.tsx` is the document and React Router's build owns the entry.
    {
      target: 'src/components/features/app-header/AppHeader.tsx',
      when: isFrameworkMode,
      variant: 'react-router',
    },
    ...([
      'src/root.tsx',
      'src/routes.ts',
      'src/routes/home.tsx',
      'src/routes/about.tsx',
      'src/routes/version.tsx',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };
      }),
  ],
  // The project gates at 100%, so a starter file with no suite fails the gate it ships with.
  starterTests: [
    ...mockTests(true),
    ...rtkTests(),
    ...accessorTests(REACT_ACCESSORS),
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
      when: (answers) => {
        return hasRouter(answers) && !isFrameworkMode(answers);
      },
      variant: 'with-router',
    },
    ...([
      ['src/routes.test.ts', 'src/routes.ts'],
      ['src/routes/about.test.tsx', 'src/routes/about.tsx'],
      ['src/routes/version.test.tsx', 'src/routes/version.tsx'],
    ] as const)
      .map(([target, covers]): StarterTest => {
        return {
          target,
          covers,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };
      }),
    // Wraps the two providers the document wraps: Home carries the counter.
    {
      target: 'src/routes/home.test.tsx',
      covers: 'src/routes/home.tsx',
      when: isFrameworkMode,
      variant: 'react-router-framework',
    },
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
    },
    {
      target: 'src/pages/about/AboutPage.test.tsx',
      covers: 'src/pages/about/AboutPage.tsx',
    },
    {
      target: 'src/pages/version/VersionPage.test.tsx',
      covers: 'src/pages/version/VersionPage.tsx',
    },
    {
      target: 'src/pages/contact/ContactPage.test.tsx',
      covers: 'src/pages/contact/ContactPage.tsx',
    },
    {
      target: 'src/components/ui/mark/Mark.test.tsx',
      covers: 'src/components/ui/mark/Mark.tsx',
    },
    {
      target: 'src/components/ui/button/Button.test.tsx',
      covers: 'src/components/ui/button/Button.tsx',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
    },
    // `App`'s own suite covers a routed header; standing it alone would need a router context.
    {
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: 'src/components/features/app-header/AppHeader.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    // Framework mode has no `App` to cover the header inside, so it stands alone in a memory router.
    {
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: 'src/components/features/app-header/AppHeader.tsx',
      when: isFrameworkMode,
      variant: 'react-router-framework',
    },
    {
      target: 'src/lib/providers/StoreProvider.test.tsx',
      covers: 'src/lib/providers/StoreProvider.tsx',
    },
    {
      target: 'src/lib/providers/DataProvider.test.tsx',
      covers: 'src/lib/providers/DataProvider.tsx',
    },
    {
      target: 'src/lib/store/counter.test.tsx',
      covers: 'src/lib/store/counter.ts',
    },
    {
      target: 'src/lib/apis/contact/api.test.tsx',
      covers: 'src/lib/apis/contact/api.ts',
    },
  ],
  // Nothing fetches this target, so without `build` the project's own gate fails at birth.
  build: 'vite build',
  extraScripts: {
    dev: 'vite',
    preview: 'vite preview',
  },
  typecheck: 'tsc --noEmit',
  // Nothing fetches these, so a name missing here is a project with no React in it.
  testDevDependencies: PARTS.react.testDevDependencies,
  dependencies: PARTS.react.dependencies,
  devDependencies: [...PARTS.react.devDependencies, 'vite'],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: ROUTER_MOCK,
};

// Overlays the record: the same React on the same Vite, with React Router's CLI owning the build.
const FRAMEWORK_MODE: Partial<TargetRecord> = {
  reactRouterProject: true,
  ignores: ['.react-router/**', 'build/**'],
  html: false,
  htmlEntry: undefined,
  // React Router's plugin expects its server's preamble and fails every suite, so the test run takes plain React.
  vitePlugin: {
    imports: [
      "import { reactRouter } from '@react-router/dev/vite';",
      "import react from '@vitejs/plugin-react';",
    ],
    calls: [`...(${OUTSIDE_TESTS} ? [reactRouter()] : [react()])`],
  },
  // `typegen` first: a route module's `Route.*` types resolve to what it writes.
  typecheck: 'react-router typegen && tsc --noEmit',
  prepare: 'react-router typegen',
  tsconfig: {
    jsx: 'react-jsx',
    include: ['.react-router/types/**/*'],
    rootDirs: ['.', './.react-router/types'],
  },
  // The document: its parts are covered where each renders.
  coverageExclude: ['src/root.tsx'],
  build: 'react-router build',
  extraScripts: {
    dev: 'react-router dev',
    start: 'react-router-serve ./build/server/index.js',
    preview: 'react-router-serve ./build/server/index.js',
  },
  dependencies: [
    ...PARTS.react.dependencies,
    '@react-router/node',
    '@react-router/serve',
    'react-router',
    // React Router's own server entry reads it to tell a crawler from a browser.
    'isbot',
  ],
  // Less the compiler, which only `react()` runs.
  devDependencies: [
    ...PARTS.react.devDependencies
      .filter((name) => {
        return name !== 'oxc-transform-react';
      }),
    'vite',
    '@react-router/dev',
  ],
};

export const reactTarget: TargetBuilder = (answers) => {
  return isFrameworkMode(answers)
    ? {
        ...baseReactTarget,
        ...FRAMEWORK_MODE,
      }
    : baseReactTarget;
};
