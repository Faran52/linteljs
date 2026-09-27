import { hasLibrary, hasTests } from '@utils/answerUtils';

import {
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  PARTS,
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
import { sfcNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  SHARED,
} from './constants';

import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

export const svelteTarget: TargetRecord = {
  id: 'svelte',
  framework: 'svelte',
  html: true,
  sfcExtension: 'svelte',
  // Runes cover component state; a store is for what crosses components.
  stores: ['tanstack-store'],
  /*
   * `src/app.html` is SvelteKit's shell rather than a document: `%sveltekit.head%` and `%sveltekit.body%` are
   * placeholders its own build fills, so the HTML layer reads it as a page with no title and no content. The title
   * it would ask for belongs in `<svelte:head>`, which is the only place that can carry the project's name.
   */
  ignores: ['.svelte-kit/**', 'src/app.html'],
  naming: sfcNaming('svelte', 'routes'),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: HOOKS_ALIAS,
  // Re-declared: an extending config replaces `paths` rather than merging `.svelte-kit/tsconfig.json`'s.
  extraAliases: {
    '$lib': './src/lib',
    '$lib/*': './src/lib/*',
  },
  // No `htmlEntry`: `src/app.html` is SvelteKit's own shell and the layout sets the title from the record.
  styleEntry: 'src/app.css',
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
  // `sveltekit()`, not `svelte()`: the bare plugin fails `vite build` on a missing `index.html`. The adapter is
  // named here because this is the whole of the SvelteKit config; there is no `svelte.config.js`.
  vitePlugin: {
    imports: [
      "import adapter from '@sveltejs/adapter-auto';",
      "import { sveltekit } from '@sveltejs/kit/vite';",
    ],
    calls: ['sveltekit({ adapter: adapter() })'],
  },
  /*
   * The four generated declarations are named here because an extending config replaces `include` rather than
   * merging it, and they are what `svelte-kit sync` writes: `non-ambient.d.ts` is where `RouteId` and
   * `RouteParams` live, so without it `resolve('/about')` asks for route parameters no route has, and `$types`
   * resolves to nothing in a `load`.
   */
  tsconfig: {
    extends: './.svelte-kit/tsconfig.json',
    include: [
      '**/*.svelte',
      '.svelte-kit/ambient.d.ts',
      '.svelte-kit/env.d.ts',
      '.svelte-kit/non-ambient.d.ts',
      '.svelte-kit/types/**/$types.d.ts',
    ],
  },
  testConditions: ['browser'],
  /*
   * The root layout is the document. Its `<svelte:head>` compiles to a hydration branch, which a suite that
   * renders rather than hydrates cannot reach, so the file sits at 50% branches against a 100% threshold. Next's
   * root layout is excluded for the same class of reason; `src/routes/layout.test.ts` still covers what it
   * renders, which is the part a project can break.
   */
  coverageExclude: ['src/routes/+layout.svelte'],
  publicDirectory: 'static',
  starterFiles: [
    ...mockFiles(true),
    ...componentStyles(),
    // Solid writes the `class` spelling `stylex.attrs` answers with, which is the one a Svelte template spreads.
    ...componentStyleModules('solid'),
    ...accessorFiles(ACCESSORS),
    /*
     * Hosts for the two hooks, because Svelte's query bindings read their client out of context and context needs
     * a component to be in. Outside `src/`, so neither is measured.
     */
    ...([
      '__mocks__/WithExtendedQuery.svelte',
      '__mocks__/WithExtendedMutation.svelte',
      '__mocks__/ExtendedQueryProbe.svelte',
      '__mocks__/ExtendedMutationProbe.svelte',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: (answers) => {
            return answers.data === 'tanstack-query';
          },
          variant: 'tanstack-query',
        };
      }),
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
    {
      target: 'src/routes/+page.svelte',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    {
      target: 'src/routes/+page.svelte',
      when: hasStore,
      variant: 'with-store',
    },
    // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
    {
      target: 'src/components/ui/button/Button.svelte',
      when: pressable,
    },
    // A form brings its route, its binding, its control and the layer it submits through.
    ...([
      'src/routes/contact/+page.svelte',
      'src/routes/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.svelte',
      'src/components/ui/text-input/types.ts',
    ] as const)
      .map((target): StarterFile => {
        return {
          target,
          when: hasForm,
        };
      }),
    {
      target: 'src/lib/apis/contact/index.ts',
      when: hasForm,
      shared: true,
    },
    // The data slot is a component on this target, so a suite that needs it around its subject needs one too.
    {
      target: '__mocks__/WithData.svelte',
      when: (answers) => {
        return hasForm(answers) && hasTests(answers);
      },
    },
    {
      target: 'src/lib/apis/contact/api.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: true,
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
    // One page list, read by the header; the routes directory is the other half and a form adds a folder to it.
    {
      target: 'src/config/routes.ts',
      when: (answers) => {
        return !hasForm(answers);
      },
    },
    {
      target: 'src/config/routes.ts',
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
      target: 'src/lib/providers/DataProvider.svelte',
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
    },
    {
      target: 'src/lib/providers/DataProvider.svelte',
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
   * Not `+page.test.ts`: SvelteKit reserves the `+` prefix, so a suite takes the rest of the name. The layout keeps
   * its suite though it is out of the measurement, because what it renders is still what a project can break.
   *
   * The generated project gates at 100% on all four metrics, so a starter file with no suite fails the gate it
   * ships with, and `covers` is what keeps a suite out of a project whose answers never wrote its subject.
   */
  starterTests: [
    ...mockTests(true),
    ...accessorTests(ACCESSORS)
      .map((test): StarterTest => {
        return {
          ...test,
        };
      }),
    {
      target: 'src/routes/layout.test.ts',
      covers: 'src/routes/+layout.svelte',
    },
    {
      target: 'src/routes/page.test.ts',
      covers: 'src/routes/+page.svelte',
      when: (answers) => {
        return !hasStore(answers);
      },
    },
    // The store's selector is an `$effect`, which runs only while a component is initialising, so the page that
    // renders it is where it is covered rather than a module suite beside it.
    {
      target: 'src/routes/page.test.ts',
      covers: 'src/routes/+page.svelte',
      when: hasStore,
      variant: 'with-store',
    },
    {
      target: 'src/routes/about/page.test.ts',
      covers: 'src/routes/about/+page.svelte',
    },
    {
      target: 'src/routes/version/page.test.ts',
      covers: 'src/routes/version/+page.svelte',
    },
    {
      target: 'src/components/ui/button/Button.test.ts',
      covers: 'src/components/ui/button/Button.svelte',
    },
    {
      target: 'src/routes/contact/page.test.ts',
      covers: 'src/routes/contact/+page.svelte',
    },
    {
      target: 'src/components/ui/text-input/TextInput.test.ts',
      covers: 'src/components/ui/text-input/TextInput.svelte',
    },
    {
      target: 'src/lib/apis/contact/api.test.ts',
      covers: 'src/lib/apis/contact/api.ts',
    },
  ],
  build: 'vite build',
  // `vite dev` rather than `vite`, which is what SvelteKit's own template runs: the kit's plugin owns the dev server.
  extraScripts: {
    dev: 'vite dev',
    preview: 'vite preview',
  },
  // `svelte-kit sync` first, since the tsconfig it writes is extended. `--fail-on-warnings`: accessibility
  // diagnostics are compiler warnings, and `eslint-plugin-svelte` v3 carries no a11y rule at all.
  typecheck: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
  prepare: 'svelte-kit sync',
  routerMock: 'fragments/test-setup/setupTests.svelteRouter.ts',
  /*
   * Read off `PARTS`, plus what makes this SvelteKit rather than Svelte on Vite: the kit itself, whose `svelte-kit`
   * binary the `prepare` script runs, and the adapter its config names. A host installs neither, because a host
   * owns its own build.
   */
  testDevDependencies: PARTS.svelte.testDevDependencies,
  dependencies: PARTS.svelte.dependencies,
  devDependencies: [...PARTS.svelte.devDependencies, '@sveltejs/kit', '@sveltejs/adapter-auto', 'vite'],
  allowBuilds: [],
  stateRules: ['svelte-reactivity.md'],
};
