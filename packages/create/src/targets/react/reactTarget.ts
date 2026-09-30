import { hasLibrary } from '@utils/answerUtils';

import {
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  OUTSIDE_TESTS,
  PARTS,
  REACT_VITE_PLUGIN,
  ROUTER_MOCK,
  STATUS_UTILS_TEST,
} from '../constants';
import { hasStore } from '../utils/gateUtils';
import { localeFiles, LOCALES_TEST } from '../utils/i18nUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
  rtkContactFiles,
  rtkContactTests,
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
  WELL_KNOWN_404,
} from './constants';
import {
  frameworkRouteFiles,
  frameworkRouteTests,
  isFrameworkMode,
} from './utils/frameworkRouteUtils';
import { reactI18nFiles, reactI18nTests } from './utils/translatedFileUtils';

import type { Answers } from '@config/types';
import type { TargetBuilder } from '../registry';
import type { StarterFile, TargetRecord } from '../types';

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
    './components/ui/button/Button.css',
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
  stores: [
    'zustand',
    'redux-toolkit',
    'tanstack-store',
  ],
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
    ...reactI18nFiles(),
    ...localeFiles(),
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
        return answers.form === undefined;
      },
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
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: (answers) => {
            return answers.form !== undefined;
          },
        };
      }),
    {
      target: 'src/lib/apis/contact/index.ts',
      when: (answers) => {
        return answers.form !== undefined && answers.data !== 'rtk-query';
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return answers.form !== undefined && answers.data === undefined;
      },
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return answers.form !== undefined && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
    },
    // RTK Query keeps its own `createApi` rather than a wrapper that would lose its cache.
    ...rtkContactFiles(),
    // TanStack Query needs an ancestor; RTK Query rides the Redux provider.
    {
      target: 'src/lib/providers/data/DataProvider.tsx',
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
    },
    {
      target: 'src/lib/providers/data/DataProvider.tsx',
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
    { target: 'src/components/ui/button/Button.tsx' },
    {
      target: 'src/App.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    // A router catches a crash in its own boundary; without one, React needs a class.
    {
      target: 'src/components/features/error-boundary/ErrorBoundary.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    {
      target: 'src/components/features/route-error/RouteError.tsx',
      when: (answers) => {
        return answers.router === 'react-router' || isFrameworkMode(answers);
      },
      variant: 'react-router',
    },
    {
      target: 'src/components/features/route-error/RouteError.tsx',
      when: (answers) => {
        return answers.router === 'tanstack-router';
      },
      variant: 'tanstack-router',
    },
    {
      target: 'src/lib/providers/store/StoreProvider.tsx',
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
      target: 'src/lib/providers/store/StoreProvider.tsx',
      when: (answers) => {
        return answers.store === 'redux-toolkit';
      },
      variant: 'redux-toolkit',
    },
    ...(['zustand', 'tanstack-store'] as const)
      .map((store): StarterFile => {
        return {
          target: 'src/lib/store/counter/counterStore.ts',
          when: (answers) => {
            return answers.store === store;
          },
          variant: store,
        };
      }),
    // RTK Query's middleware must be registered in the Redux store.
    {
      target: 'src/lib/store/counter/counterStore.ts',
      when: (answers) => {
        return answers.store === 'redux-toolkit' && answers.data !== 'rtk-query';
      },
      variant: 'redux-toolkit',
    },
    {
      target: 'src/lib/store/counter/counterStore.ts',
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
    // StyleX's dev CSS goes into `index.html`, so its framework document links it itself.
    ...([['react-router-framework', false], ['stylex', true]] as const)
      .map(([variant, stylex]): StarterFile => {
        return {
          target: 'src/root.tsx',
          when: (answers) => {
            return isFrameworkMode(answers) && (answers.styling === 'stylex') === stylex;
          },
          variant,
        };
      }),
    ...frameworkRouteFiles(),
  ],
  // The project gates at 100%, so a starter file with no suite fails the gate it ships with.
  starterTests: [
    ...mockTests(true),
    STATUS_UTILS_TEST,
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
    ...frameworkRouteTests(),
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
      target: 'src/components/features/error-boundary/ErrorBoundary.test.tsx',
      covers: 'src/components/features/error-boundary/ErrorBoundary.tsx',
    },
    {
      target: 'src/components/features/route-error/RouteError.test.tsx',
      covers: 'src/components/features/route-error/RouteError.tsx',
      when: (answers) => {
        return answers.router === 'react-router' || isFrameworkMode(answers);
      },
      variant: 'react-router',
    },
    {
      target: 'src/components/features/route-error/RouteError.test.tsx',
      covers: 'src/components/features/route-error/RouteError.tsx',
      when: (answers) => {
        return answers.router === 'tanstack-router';
      },
      variant: 'tanstack-router',
    },
    {
      target: 'src/components/ui/button/Button.test.tsx',
      covers: 'src/components/ui/button/Button.tsx',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
    },
    ...reactI18nTests(),
    LOCALES_TEST,
    // Framework mode has no `App` to cover the header inside, so it stands alone in a memory router.
    {
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: 'src/components/features/app-header/AppHeader.tsx',
      when: isFrameworkMode,
      variant: 'react-router-framework',
    },
    {
      target: 'src/lib/providers/store/StoreProvider.test.tsx',
      covers: 'src/lib/providers/store/StoreProvider.tsx',
    },
    {
      target: 'src/lib/providers/data/DataProvider.test.tsx',
      covers: 'src/lib/providers/data/DataProvider.tsx',
    },
    {
      target: 'src/lib/store/counter/counterStore.test.ts',
      covers: 'src/lib/store/counter/counterStore.ts',
    },
    {
      target: 'src/lib/apis/contact/contactApi.test.ts',
      covers: 'src/lib/apis/contact/contactApi.ts',
    },
    ...rtkContactTests(),
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
    calls: [WELL_KNOWN_404, `...(${OUTSIDE_TESTS} ? [reactRouter()] : [react()])`],
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

// A routed starter is not translated yet, so only the routerless one asks for languages.
export const reactTarget: TargetBuilder = (answers) => {
  if (isFrameworkMode(answers)) {
    return {
      ...baseReactTarget,
      ...FRAMEWORK_MODE,
    };
  }

  return hasRouter(answers)
    ? baseReactTarget
    : {
        ...baseReactTarget,
        i18n: {
          dependencies: [
            'i18next',
            'i18next-browser-languagedetector',
            'react-i18next',
          ],
          testSetup: 'fragments/test-setup/setupTests.i18n.ts',
        },
      };
};
