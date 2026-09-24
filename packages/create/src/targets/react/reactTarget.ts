import { hasLibrary } from '@answers/utils/answerUtils';

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
  PROVIDERS,
  REACT_ACCESSORS,
  ROUTERS,
  SHARED,
} from './constants';

import type { Answers } from '@answers/registry';
import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

// Framework mode moves the build, the typecheck, the vite plugin and the tsconfig, which is what makes the record
// a function of the answers rather than a constant.
const isFrameworkMode = (answers: Answers): boolean => {
  return answers.router === 'react-router-framework';
};

const hasRouter = (answers: Answers): boolean => {
  return answers.router !== undefined;
};

const baseReactTarget: TargetRecord = {
  id: 'react',
  recordModule: 'src/config/linteljs.ts',
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
  vite: true,
  routeUnit: 'src/pages/<kebab>/{Name}Page.tsx',
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
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
      return {
        target,
        shared: true,
      };
    }),
    /*
     * Every styled component's rules as a module beside it, both spellings. `AppHeader.tsx` varies by router
     * alone and not by router times styling, which is the copy-per-combination this repository refuses.
     */
    ...componentStyleModules(),
    /*
     * The client entry, everywhere but framework mode. There React Router's own build owns it and `root.tsx` is
     * what a request reaches, so an entry of this repository's own would be a second one nothing calls.
     */
    {
      target: 'src/main.tsx',
      when: (answers) => {
        return !isFrameworkMode(answers);
      },
    },
    // One route list, read by the header, the route table and the no-router switch alike. A form adds Contact to
    // it and every reader follows, so none of the three needs a second spelling.
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
    // Home carries the store demo; which store it is lives in the store module rather than here.
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
    // The barrel names what exists: the mark always, a button once something presses, an input once there is a form.
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return !hasStore(answers) && answers.form === undefined;
      },
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return hasStore(answers) && answers.form === undefined;
      },
      variant: 'with-store',
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return answers.form !== undefined;
      },
      variant: 'with-form',
    },
    // A form brings its page, its control and the layer it submits through.
    ...([
      'src/pages/contact/ContactPage.tsx',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/index.ts',
    ] as const).map((target): StarterFile => {
      return {
        target,
        when: (answers) => {
          return answers.form !== undefined;
        },
      };
    }),
    /*
     * One submit shape across all three, so the form hook is written once: a plain call with no data layer, a
     * mutation under TanStack Query, and a generated endpoint under RTK Query, which keeps its own `createApi`
     * rather than being wrapped in a function and losing the cache that is the reason to pick it.
     */
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return answers.form !== undefined && answers.data === undefined;
      },
    },
    ...(['tanstack-query', 'rtk-query'] as const).map((data): StarterFile => {
      return {
        target: 'src/lib/apis/contact/api.ts',
        when: (answers) => {
          return answers.form !== undefined && answers.data === data;
        },
        variant: data,
      };
    }),
    // TanStack Query is the one data layer needing an ancestor; RTK Query rides the Redux provider beside it.
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
    // One rule set, read by the form that binds it and the api that refuses on it. Zod replaces the file, not the
    // two readers.
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
    ...(['tanstack-form', 'react-hook-form'] as const).map((form): StarterFile => {
      return {
        target: 'src/pages/contact/useContactForm.ts',
        when: (answers) => {
          return answers.form === form;
        },
        variant: form,
      };
    }),
    // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
    {
      target: 'src/components/ui/button/Button.tsx',
      when: (answers) => {
        return hasStore(answers) || answers.form !== undefined;
      },
    },
    // Without a router the header swaps the page from state, so its tabs are controls rather than links.
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
    // Redux is the one store needing an ancestor; the other two pass their children through.
    {
      target: 'src/lib/providers/StoreProvider.tsx',
      when: (answers) => {
        return answers.store !== 'redux-toolkit';
      },
    },
    ...mockFiles(),
    ...componentStyles(),
    ...rtkFiles(),
    // React calls it a hook, and the record says where its own live.
    ...accessorFiles(REACT_ACCESSORS),
    // Tailwind reads the tokens through its own names; StyleX compiles a copy of them.
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
    // The markup is the same for every store, so only the module behind `useCounter` varies by which one.
    ...(['zustand', 'tanstack-store'] as const).map((store): StarterFile => {
      return {
        target: 'src/lib/store/counter.ts',
        when: (answers) => {
          return answers.store === store;
        },
        variant: store,
      };
    }),
    // The Redux store is the one place RTK Query has to be registered, since its middleware is what makes it work.
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
    // A router replaces the entry and routes the same pages, and renders the header's tabs as real links.
    ...DECLARATIVE_ROUTERS.flatMap((router): StarterFile[] => {
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
    ] as const).map((target): StarterFile => {
      return {
        target,
        when: (answers) => {
          return answers.router === 'react-router';
        },
        variant: 'react-router',
      };
    }),
    /*
     * Framework mode's own five. The header is the `react-router` one verbatim, because `NavLink` off `ROUTES` is
     * the same in both, and there is no `App.tsx` or `main.tsx`: `root.tsx` is the document and React Router's
     * build owns the entry.
     */
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
    ] as const).map((target): StarterFile => {
      return {
        target,
        when: isFrameworkMode,
        variant: 'react-router-framework',
      };
    }),
  ],
  /*
   * Every suite covers a file this repository wrote, so none of them gates on the file existing any more, and
   * `covers` is what keeps a suite out of a project whose answers never wrote its subject. The generated project
   * gates at 100% on all four metrics, so a starter file with no suite fails the gate it ships with.
   */
  starterTests: [
    ...mockTests(),
    ...rtkTests(),
    ...accessorTests(REACT_ACCESSORS),
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
      needs: PROVIDERS,
    },
    // With a router the header renders links rather than buttons and `App` takes no page, so the suite changes
    // with it. One variant for both routers: what they change about this file is the same.
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
      when: (answers) => {
        return hasRouter(answers) && !isFrameworkMode(answers);
      },
      variant: 'with-router',
      needs: PROVIDERS,
    },
    // Framework mode's four, one per module it adds that is not the document.
    ...([
      ['src/routes.test.ts', 'src/routes.ts'],
      ['src/routes/about.test.tsx', 'src/routes/about.tsx'],
      ['src/routes/version.test.tsx', 'src/routes/version.tsx'],
    ] as const).map(([target, covers]): StarterTest => {
      return {
        target,
        covers,
        when: isFrameworkMode,
        variant: 'react-router-framework',
      };
    }),
    // Home is the one that carries the counter, so its suite wraps the two providers the document wraps.
    {
      target: 'src/routes/home.test.tsx',
      covers: 'src/routes/home.tsx',
      when: isFrameworkMode,
      variant: 'react-router-framework',
      needs: PROVIDERS,
    },
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
      needs: PROVIDERS,
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
    // A router renders the header inside itself, where `App`'s own suite covers it; standing it up alone would
    // need a router context around it and would assert what that suite already does.
    {
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: 'src/components/features/app-header/AppHeader.tsx',
      when: (answers) => {
        return !hasRouter(answers);
      },
    },
    /*
     * Framework mode is the one routed answer with no `App` for the header to be covered inside, since `root.tsx`
     * is the document and excluded. So the header stands alone here, in a memory router, and that is also what
     * covers the route list it reads.
     */
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
      needs: ['src/lib/providers/StoreProvider.tsx'],
    },
    {
      target: 'src/lib/apis/contact/api.test.tsx',
      covers: 'src/lib/apis/contact/api.ts',
      needs: ['src/lib/providers/DataProvider.tsx', 'src/lib/providers/StoreProvider.tsx'],
    },
  ],
  /*
   * The three a scaffolder used to write. Nothing fetches this target any more, so `pnpm check` chaining `build`
   * would find no such script and a project would fail its own gate at birth.
   */
  build: 'vite build',
  extraScripts: {
    dev: 'vite',
    preview: 'vite preview',
  },
  typecheck: 'tsc --noEmit',
  /*
   * Read off `PARTS` rather than restated: this target installs the same framework a host installs, and the only
   * difference is that it owns the build, which is what `vite` is here for. Nothing fetches these any more, so a
   * name missing from this list is a project with no React in it.
   */
  testDevDependencies: PARTS.react.testDevDependencies,
  dependencies: PARTS.react.dependencies,
  devDependencies: [...PARTS.react.devDependencies, 'vite'],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: ROUTER_MOCK,
};

/*
 * Framework mode is the same React on the same Vite, so it overlays the record rather than replacing it. What it
 * moves is everything downstream of who owns the build: React Router's own CLI does, so the build, the dev server,
 * the typecheck and the vite plugin are all its, and the document comes from a route module rather than an
 * `index.html`. `appDirectory` is set to `src` in `react-router.config.ts`, so the source root does not move and
 * every glob in this repository still reads one.
 */
const FRAMEWORK_MODE: Partial<TargetRecord> = {
  reactRouterProject: true,
  /*
   * `typegen` writes the route types under `.react-router/`, and `react-router build` writes `build/`. Both are
   * generated, so both are ignored, the same way `.svelte-kit/` and `.expo/` are on the targets that generate.
   */
  ignores: ['.react-router/**', 'build/**'],
  // No `index.html`: `root.tsx` is the document, and the dev server serves it.
  html: false,
  htmlEntry: undefined,
  /*
   * React Router's plugin owns the build and the dev server, and cannot run under vitest: it expects its own
   * server to have injected a preamble, and every suite fails on its absence. So the same swap the React Compiler
   * already takes, for the same reason and in the same place: the router's plugin outside the test run, and the
   * plain React transform inside it, which is all a suite that renders a component needs.
   */
  vitePlugin: {
    imports: [
      "import { reactRouter } from '@react-router/dev/vite';",
      "import react from '@vitejs/plugin-react';",
    ],
    calls: [`...(${OUTSIDE_TESTS} ? [reactRouter()] : [react()])`],
  },
  /*
   * `typegen` before `tsc`, because the route types it writes under `.react-router/` are what a route module's own
   * `Route.*` types resolve to, and `rootDirs` is what lets them sit beside the module rather than be imported.
   */
  typecheck: 'react-router typegen && tsc --noEmit',
  prepare: 'react-router typegen',
  tsconfig: {
    jsx: 'react-jsx',
    include: ['.react-router/types/**/*'],
    rootDirs: ['.', './.react-router/types'],
  },
  // The document, which is Next's trade too: what it composes is covered where each part renders.
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
  devDependencies: [...PARTS.react.devDependencies, 'vite', '@react-router/dev'],
  routeUnit: 'src/routes/, declared in src/routes.ts',
};

export const reactTarget: TargetBuilder = (answers) => {
  return isFrameworkMode(answers)
    ? {
        ...baseReactTarget,
        ...FRAMEWORK_MODE,
      }
    : baseReactTarget;
};
