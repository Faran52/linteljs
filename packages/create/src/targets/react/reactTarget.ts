import { hasTests } from '@utils/answerUtils';

import {
  CONTACT_HOOK_FORMS,
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  COUNTER_MODULE_STORES,
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  OUTSIDE_TESTS,
  PARTS,
  REACT_VITE_PLUGIN,
  ROUTER_MOCK,
  STATUS_UTILS_TEST,
  VITE_GITIGNORE,
  VITE_WORKER_START,
} from '../constants';
import { hasForm, hasStore } from '../utils/gateUtils';
import {
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
  translated,
} from '../utils/i18nUtils';
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
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  contactSubmitTests,
  filesAt,
} from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ALWAYS,
  DECLARATIVE_ROUTERS,
  REACT_ACCESSORS,
  REACT_I18N,
  ROOT_VARIANTS,
  ROUTER_ALIAS,
  ROUTERS,
  SHARED,
  WELL_KNOWN_404,
} from './constants';
import {
  frameworkRouteFiles,
  frameworkRouteTests,
  hasRouter,
  isFrameworkMode,
} from './utils/frameworkRouteUtils';
import { reactI18nFiles, reactI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

const reactStarterTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...mockTests(),
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
    ...translated<StarterTest>({
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
    }),
    {
      target: 'src/router/router.test.ts',
      covers: 'src/router/router.tsx',
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
    languageUtilsTest(),
    COOKIE_UTILS_TEST,
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
    {
      target: 'src/pages/contact/use-contact-form/useContactForm.test.ts',
      covers: 'src/pages/contact/use-contact-form/useContactForm.ts',
    },
    contactFormTest(),
    ...contactSubmitTests(),
    ...rtkContactTests(),
  ];

  return tests;
};

const baseReactTarget = (): TargetRecord => {
  const record: TargetRecord = {
    id: 'react',
    htmlEntry: 'src/main.tsx',
    workerStart: {
      entries: ['src/main.tsx', 'src/root.tsx'],
      code: VITE_WORKER_START,
    },
    starterStyles: [
      './styles/tokens.css',
      './styles/base.css',
      './components/features/app-header/AppHeader.css',
      './components/ui/mark/Mark.css',
      './components/ui/button/Button.css',
      {
        path: './components/ui/text-input/TextInput.css',
        when: hasForm,
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
    gitignore: VITE_GITIGNORE,
    naming: componentNaming(),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: HOOKS_ALIAS,
    routeAlias: ROUTER_ALIAS,
    publicDirectory: 'public',
    styleEntry: 'src/index.css',
    vitePlugin: REACT_VITE_PLUGIN,
    tsconfig: { jsx: 'react-jsx' },
    starterFiles: [
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      // So `AppHeader.tsx` varies by router alone, not router times styling.
      ...componentStyleModules(),
      ...reactI18nFiles(),
      ...localeFiles(hasForm),
      languageUtilsFile(),
      COOKIE_UTILS,
      {
        target: '__mocks__/WithProviders.tsx',
        when: (answers) => {
          return hasTests(answers) && hasForm(answers);
        },
      },
      {
        target: 'src/router/router.tsx',
        when: (answers) => {
          return answers.form === undefined;
        },
      },
      {
        target: 'src/router/router.tsx',
        when: hasForm,
        variant: 'with-form',
      },
      ...translated<StarterFile>({
        target: 'src/pages/home/HomePage.tsx',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterFile>({
        target: 'src/pages/home/HomePage.tsx',
        when: hasStore,
        variant: 'with-store',
      }),
      {
        target: 'src/components/ui/index.ts',
        when: (answers) => {
          return answers.form === undefined;
        },
        shared: true,
      },
      {
        target: 'src/components/ui/index.ts',
        when: hasForm,
        variant: 'with-form',
        shared: true,
      },
      {
        target: 'src/components/ui/text-input/TextInput.tsx',
        when: hasForm,
      },
      ...contactApiFiles({ shared: 'react' }),
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
      ...contactFormFiles(),
      ...CONTACT_HOOK_FORMS
        .map((form): StarterFile => {
          const file: StarterFile = {
            target: 'src/pages/contact/use-contact-form/useContactForm.ts',
            when: (answers) => {
              return answers.form === form;
            },
            variant: form,
          };

          return file;
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
      ...mockFiles(hasForm),
      ...componentStyles(),
      ...rtkFiles(),
      ...accessorFiles(REACT_ACCESSORS),
      tailwindThemeFile(),
      {
        target: 'src/lib/providers/store/StoreProvider.tsx',
        when: (answers) => {
          return answers.store === 'redux-toolkit';
        },
        variant: 'redux-toolkit',
      },
      ...COUNTER_MODULE_STORES
        .map((store): StarterFile => {
          const file: StarterFile = {
            target: 'src/lib/store/counter/counterStore.ts',
            when: (answers) => {
              return answers.store === store;
            },
            variant: store,
          };

          return file;
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
        .map((router): StarterFile => {
          const file: StarterFile = {
            target: 'src/App.tsx',
            when: (answers) => {
              return answers.router === router;
            },
            variant: router,
          };

          return file;
        }),
      // No `App.tsx` or `main.tsx`: `root.tsx` is the document and React Router's build owns the entry.
      // StyleX's dev CSS goes into `index.html`, so its framework document links it itself.
      ...ROOT_VARIANTS
        .flatMap(([variant, stylex]): StarterFile[] => {
          return translated<StarterFile>({
            target: 'src/root.tsx',
            when: (answers) => {
              return isFrameworkMode(answers) && (answers.styling === 'stylex') === stylex;
            },
            variant,
          });
        }),
      ...frameworkRouteFiles(),
    ],
    // The project gates at 100%, so a starter file with no suite fails the gate it ships with.
    starterTests: reactStarterTests(),
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

  return record;
};

// Overlays the record: the same React on the same Vite, with React Router's CLI owning the build.
const frameworkMode = (): Partial<TargetRecord> => {
  const record: Partial<TargetRecord> = {
    reactRouterProject: true,
    ignores: ['.react-router/**', 'build/**'],
    gitignore: ['/.react-router/', '/build/'],
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

  return record;
};

export const reactTarget: TargetBuilder = (answers) => {
  const record: TargetRecord = {
    ...baseReactTarget(),
    ...(isFrameworkMode(answers) ? frameworkMode() : {}),
    i18n: REACT_I18N,
  };

  return record;
};
