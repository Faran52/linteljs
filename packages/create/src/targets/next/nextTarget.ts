import { hasLibrary } from '@answers/utils/answerUtils';

import {
  COMMON_REACT_PLUGINS,
  FOLDER_ROUTED,
  HOOKS_ALIAS,
} from '../constants';
import { REACT_ACCESSORS as SOURCE_ACCESSORS } from '../react/constants';
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
  ACCESSORS,
  ALWAYS,
  FROM_REACT,
  hasForm,
  hasStore,
  pressable,
  SHARED,
} from './constants';

import type { Store } from '@answers/target/store/storeAnswer';
import type { StarterFile, TargetRecord } from '../types';

const STORES: readonly Store[] = ['zustand', 'redux-toolkit', 'tanstack-store'];

export const nextTarget: TargetRecord = {
  id: 'next',
  recordModule: 'src/config/linteljs.ts',
  framework: 'next',
  // The App Router owns the document, so there is no index.html to lint and none to write.
  html: false,
  vite: false,
  routeUnit: 'src/app/',
  stores: STORES,
  ignores: ['.next/**', 'out/**', 'next-env.d.ts'],
  naming: componentNaming('app'),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: HOOKS_ALIAS,
  extraAliases: {
    '@server/*': './src/lib/server/*',
    '@content/*': './src/content/*',
  },
  styleEntry: 'src/app/globals.css',
  /*
   * Next owns its build and has no Vite config to plug into, so StyleX compiles through Babel and PostCSS here.
   * The unplugin is installed too and is the test run's half: vitest does not go through Next's pipeline, so
   * without it every suite fails on an uncompiled `defineVars`.
   */
  stylexBuild: [
    '@stylexjs/babel-plugin',
    '@stylexjs/postcss-plugin',
    'postcss',
    '@stylexjs/unplugin',
    'unplugin',
  ],
  stylexAtRule: true,
  starterStyles: [
    '../styles/tokens.css',
    '../styles/base.css',
    '../components/features/app-header/AppHeader.css',
    '../components/ui/mark/Mark.css',
    {
      path: '../components/ui/button/Button.css',
      when: (answers) => {
        return answers.store !== undefined || answers.form !== undefined;
      },
    },
    {
      path: '../components/ui/text-input/TextInput.css',
      when: (answers) => {
        return answers.form !== undefined;
      },
    },
  ],
  tailwindTheme: '../styles/theme.css',
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    jsx: 'react-jsx',
    plugins: [{ name: 'next' }],
    // Next rewrites tsconfig.json on every dev boot unless every key it wants is already declared.
    include: ['next-env.d.ts', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
  },
  // The root layout renders the document; what it composes is covered where each part renders.
  coverageExclude: ['src/app/layout.tsx'],
  publicDirectory: 'public',
  starterFiles: [
    ...mockFiles(),
    ...componentStyles(),
    // Next takes React's `className` spelling, which is what `stylex.props` answers with.
    ...componentStyleModules('react'),
    // The two halves of the Babel and PostCSS path, which is how StyleX reaches a build Vite does not own.
    ...(['.babelrc', 'postcss.config.mjs'] as const).map((target): StarterFile => {
      return {
        target,
        when: (answers) => {
          return answers.styling === 'stylex';
        },
        variant: 'stylex',
      };
    }),
    ...accessorFiles(ACCESSORS, {
      shared: 'react',
      names: SOURCE_ACCESSORS,
    }),
    ...rtkFiles(),
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
      return {
        target,
        shared: true,
      };
    }),
    ...FROM_REACT.filter((target) => {
      return !target.includes('text-input') && !target.includes('apis');
    }).map((target): StarterFile => {
      return {
        target,
        shared: 'react',
      };
    }),
    // One page list, read by the header; the routes directory is the other half and a form adds a folder to it.
    {
      target: 'src/config/routes.ts',
      when: (answers) => {
        return !hasForm(answers);
      },
      shared: true,
    },
    {
      target: 'src/config/routes.ts',
      when: hasForm,
      variant: 'with-form',
      shared: true,
    },
    // The home route is the one page a store changes, and a store makes it a client component.
    {
      target: 'src/app/page.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/app/page.tsx',
      when: hasStore,
      variant: 'with-store',
    },
    // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
    {
      target: 'src/components/ui/button/Button.tsx',
      when: pressable,
      shared: 'react',
    },
    // The barrel is a list of what exists, so it takes the spelling the answers reach.
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return !pressable(answers);
      },
      shared: 'react',
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return hasStore(answers) && !hasForm(answers);
      },
      variant: 'with-store',
      shared: 'react',
    },
    {
      target: 'src/components/ui/index.ts',
      when: hasForm,
      variant: 'with-form',
      shared: 'react',
    },
    // A form brings its route, its binding, its control and the layer it submits through.
    {
      target: 'src/app/contact/page.tsx',
      when: hasForm,
    },
    ...(['tanstack-form', 'react-hook-form'] as const).map((form): StarterFile => {
      return {
        target: 'src/app/contact/useContactForm.ts',
        when: (answers) => {
          return answers.form === form;
        },
        variant: form,
      };
    }),
    ...([
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/index.ts',
    ] as const).map((target): StarterFile => {
      return {
        target,
        when: hasForm,
        shared: 'react',
      };
    }),
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: 'react',
    },
    ...(['tanstack-query', 'rtk-query'] as const).map((data): StarterFile => {
      return {
        target: 'src/lib/apis/contact/api.ts',
        when: (answers) => {
          return hasForm(answers) && answers.data === data;
        },
        variant: data,
        shared: 'react',
      };
    }),
    // One rule set, read by the form that binds it and the api that refuses on it.
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && !hasLibrary(answers, 'zod');
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && hasLibrary(answers, 'zod');
      },
      variant: 'zod',
      shared: true,
    },
    // Both slots are this target's own, because the directive on them is what makes them the client boundary.
    {
      target: 'src/lib/providers/StoreProvider.tsx',
      when: (answers) => {
        return answers.store !== 'redux-toolkit';
      },
    },
    {
      target: 'src/lib/providers/StoreProvider.tsx',
      when: (answers) => {
        return answers.store === 'redux-toolkit';
      },
      variant: 'redux-toolkit',
    },
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
    // The markup is the same for every store, so only the module behind `useCounter` varies by which one.
    ...(['zustand', 'tanstack-store'] as const).map((store): StarterFile => {
      return {
        target: 'src/lib/store/counter.ts',
        when: (answers) => {
          return answers.store === store;
        },
        variant: store,
        shared: 'react',
      };
    }),
    // The Redux store is the one place RTK Query has to be registered, since its middleware is what makes it work.
    {
      target: 'src/lib/store/counter.ts',
      when: (answers) => {
        return answers.store === 'redux-toolkit' && answers.data !== 'rtk-query';
      },
      variant: 'redux-toolkit',
      shared: 'react',
    },
    {
      target: 'src/lib/store/counter.ts',
      when: (answers) => {
        return answers.store === 'redux-toolkit' && answers.data === 'rtk-query';
      },
      variant: 'rtk-query',
      shared: 'react',
    },
    // Tailwind reads the tokens through its own names; StyleX compiles a copy of them.
    {
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ],
  /*
   * The generated project gates at 100% on all four metrics, so a starter file with no suite fails the gate it
   * ships with. A suite whose subject is React's is React's too.
   */
  starterTests: [
    ...mockTests(),
    ...accessorTests(ACCESSORS, {
      shared: 'react',
      names: SOURCE_ACCESSORS,
    }),
    ...rtkTests(),
    {
      target: 'src/app/page.test.tsx',
      covers: 'src/app/page.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/app/page.test.tsx',
      covers: 'src/app/page.tsx',
      when: hasStore,
      variant: 'with-store',
      needs: ['src/lib/providers/StoreProvider.tsx'],
    },
    {
      target: 'src/app/about/page.test.tsx',
      covers: 'src/app/about/page.tsx',
    },
    {
      target: 'src/app/version/page.test.tsx',
      covers: 'src/app/version/page.tsx',
    },
    {
      target: 'src/app/contact/page.test.tsx',
      covers: 'src/app/contact/page.tsx',
      needs: ['src/lib/providers/StoreProvider.tsx', 'src/lib/providers/DataProvider.tsx'],
    },
    {
      target: 'src/components/features/app-header/AppHeader.test.tsx',
      covers: 'src/components/features/app-header/AppHeader.tsx',
    },
    {
      target: 'src/components/ui/mark/Mark.test.tsx',
      covers: 'src/components/ui/mark/Mark.tsx',
      shared: 'react',
    },
    {
      target: 'src/components/ui/button/Button.test.tsx',
      covers: 'src/components/ui/button/Button.tsx',
      shared: 'react',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/providers/StoreProvider.test.tsx',
      covers: 'src/lib/providers/StoreProvider.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/providers/DataProvider.test.tsx',
      covers: 'src/lib/providers/DataProvider.tsx',
      shared: 'react',
    },
    {
      target: 'src/lib/store/counter.test.tsx',
      covers: 'src/lib/store/counter.ts',
      needs: ['src/lib/providers/StoreProvider.tsx'],
      shared: 'react',
    },
    {
      target: 'src/lib/apis/contact/api.test.tsx',
      covers: 'src/lib/apis/contact/api.ts',
      needs: ['src/lib/providers/DataProvider.tsx', 'src/lib/providers/StoreProvider.tsx'],
      shared: 'react',
    },
  ],
  // `next typegen` first: the template's route types are declared into `.next/types` only after a build.
  typecheck: 'next typegen && tsc --noEmit',
  // The three a scaffolder used to write.
  build: 'next build',
  extraScripts: {
    dev: 'next dev',
    start: 'next start',
  },
  testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
  dependencies: ['next', 'react', 'react-dom'],
  // The plugin, not `eslint-config-next`; `frameworks/next.ts` says why.
  devDependencies: [...COMMON_REACT_PLUGINS, '@next/eslint-plugin-next', '@types/react', '@types/react-dom'],
  allowBuilds: [],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: 'fragments/test-setup/setupTests.nextRouter.ts',
};
