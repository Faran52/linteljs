import { hasLibrary } from '@answers/utils/answerUtils';

import {
  FOLDER_ROUTED,
  OUTSIDE_TESTS,
  PARTS,
  ROUTER_MOCK,
} from '../constants';
import {
  hasForm,
  hasStore,
  pressable,
} from '../utils/gateUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  SHARED,
} from './constants';

import type { StarterFile, TargetRecord } from '../types';

export const solidTarget: TargetRecord = {
  id: 'solid',
  htmlEntry: 'src/index.tsx',
  framework: 'solid',
  html: true,
  // Solid's own stores cover a component; this is for what crosses one.
  stores: ['tanstack-store'],
  ignores: [],
  naming: componentNaming(),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: { '@primitives/*': './src/lib/primitives/*' },
  publicDirectory: 'public',
  styleEntry: 'src/index.css',
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
  starterFiles: [
    ...mockFiles(true),
    ...componentStyles(),
    // Solid writes the `class` spelling, which `stylex.attrs` answers with; the other SFC targets take these.
    ...componentStyleModules(),
    ...accessorFiles(ACCESSORS),
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
      return {
        target,
        shared: true,
      };
    }),
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
        return !hasStore(answers) && !hasForm(answers);
      },
    },
    {
      target: 'src/components/ui/index.ts',
      when: (answers) => {
        return hasStore(answers) && !hasForm(answers);
      },
      variant: 'with-store',
    },
    // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
    {
      target: 'src/components/ui/button/Button.tsx',
      when: pressable,
    },
    // A form brings its page, its binding, its control and the layer it submits through.
    ...([
      'src/pages/contact/ContactPage.tsx',
      'src/pages/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/index.ts',
    ] as const).map((target): StarterFile => {
      return {
        target,
        when: hasForm,
      };
    }),
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
    },
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
    },
    // One rule set, read by the form that binds it and the api that refuses on it. Zod replaces the file, not the
    // two readers.
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
    // The barrel and the route list are what a form adds itself to; both read one list of what exists.
    {
      target: 'src/components/ui/index.ts',
      when: hasForm,
      variant: 'with-form',
    },
    // One route list, read by the header and the no-router switch alike. A form adds Contact to it and both
    // readers follow, so neither needs a second spelling.
    {
      target: 'src/pages/routes.tsx',
      when: (answers) => {
        return !hasForm(answers);
      },
    },
    {
      target: 'src/pages/routes.tsx',
      when: hasForm,
      variant: 'with-form',
    },
    {
      target: 'src/lib/store/counter.ts',
      when: hasStore,
      variant: 'tanstack-store',
    },
    // TanStack Query is the one data layer this target offers, and it needs an ancestor.
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
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ],
  /*
   * `covers` keeps a suite out of a project whose answers never wrote its subject. The generated project gates at
   * 100% on all four metrics, so a starter file with no suite fails the gate it ships with.
   */
  starterTests: [
    ...mockTests(true),
    ...accessorTests(ACCESSORS),
    {
      target: 'src/App.test.tsx',
      covers: 'src/App.tsx',
    },
    // The page that holds the counter: its button is a child of that file and nothing else renders it.
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/pages/home/HomePage.test.tsx',
      covers: 'src/pages/home/HomePage.tsx',
      when: hasStore,
      variant: 'with-store',
    },
    {
      target: 'src/pages/contact/ContactPage.test.tsx',
      covers: 'src/pages/contact/ContactPage.tsx',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.tsx',
      covers: 'src/components/ui/text-input/TextInput.tsx',
    },
    {
      target: 'src/lib/apis/contact/api.test.tsx',
      covers: 'src/lib/apis/contact/api.ts',
    },
    {
      target: 'src/components/ui/button/Button.test.tsx',
      covers: 'src/components/ui/button/Button.tsx',
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
  ],
  // Nothing fetches this target, so without `build` here `pnpm check` would fail the project's own gate at birth.
  build: 'vite build',
  extraScripts: {
    dev: 'vite',
    preview: 'vite preview',
  },
  typecheck: 'tsc --noEmit',
  // Read off `PARTS`, since this target installs the same framework a host installs and only adds the build.
  testDevDependencies: PARTS.solid.testDevDependencies,
  dependencies: PARTS.solid.dependencies,
  devDependencies: [...PARTS.solid.devDependencies, 'vite'],
  allowBuilds: [],
  stateRules: ['solid-reactivity.md'],
  routerMock: ROUTER_MOCK,
};
