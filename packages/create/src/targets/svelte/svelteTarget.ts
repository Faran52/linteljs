import { hasTests } from '@utils/answerUtils';

import {
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  FOLDER_ROUTED,
  HOOKS_ALIAS,
  PARTS,
} from '../constants';
import {
  hasForm,
  hasStore,
} from '../utils/gateUtils';
import { localeFiles, LOCALES_TEST } from '../utils/i18nUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { sfcNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactSchemaFiles,
  filesAt,
} from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  stylexDocument,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ACCESSORS,
  ALWAYS,
  FORM_FILES,
  QUERY_CONTEXT_MOCKS,
  SHARED,
  SVELTE_I18N,
} from './constants';
import { svelteI18nFiles, svelteI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type {
  TargetRecord,
} from '../types';

export const svelteTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'svelte',
    framework: 'svelte',
    html: true,
    sfcExtension: 'svelte',
    stores: ['tanstack-store'],
    // `%sveltekit.head%` and `%sveltekit.body%` are placeholders, so the HTML layer reads an empty page.
    ignores: ['.svelte-kit/**', 'src/app.html'],
    naming: sfcNaming('svelte', 'routes'),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: HOOKS_ALIAS,
    // An extending config replaces `paths` rather than merging `.svelte-kit/tsconfig.json`'s.
    extraAliases: {
      '$lib/*': './src/lib/*',
    },
    styleEntry: 'src/app.css',
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
    // `sveltekit()`, not `svelte()`: the bare plugin fails `vite build` on a missing `index.html`.
    vitePlugin: {
      imports: [
        "import adapter from '@sveltejs/adapter-auto';",
        "import { sveltekit } from '@sveltejs/kit/vite';",
      ],
      calls: ['sveltekit({ adapter: adapter() })'],
    },
    // An extending config replaces `include`, and `non-ambient.d.ts` is where `RouteId` lives.
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
    // `<svelte:head>` compiles to a hydration branch a rendering suite cannot reach.
    coverageExclude: ['src/routes/+layout.svelte'],
    publicDirectory: 'static',
    starterFiles: [
      ...mockFiles(true),
      ...componentStyles(),
      ...componentStyleModules('solid'),
      ...stylexDocument('src/routes/+layout.svelte'),
      ...accessorFiles(ACCESSORS),
      ...svelteI18nFiles(),
      ...localeFiles(),
      COOKIE_UTILS,
      // Svelte's query bindings read their client out of context, which needs a component.
      ...filesAt(QUERY_CONTEXT_MOCKS, {
        when: (answers) => {
          return answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
      }),
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      {
        target: 'static/favicon.svg',
        shared: true,
        source: 'public/favicon.svg',
      },
      {
        target: 'static/robots.txt',
        shared: true,
        source: 'public/robots.txt',
      },
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
      { target: 'src/components/ui/button/Button.svelte' },
      ...filesAt(FORM_FILES, {
        when: hasForm,
      }),
      ...contactApiFiles(),
      // The data slot is a component here, so a suite needing it needs one too.
      {
        target: '__mocks__/WithData.svelte',
        when: (answers) => {
          return hasForm(answers) && hasTests(answers);
        },
      },
      ...contactSchemaFiles(),
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
        target: 'src/lib/store/counter/counterStore.ts',
        when: hasStore,
        variant: 'tanstack-store',
      },
      {
        target: 'src/lib/providers/data/DataProvider.svelte',
        when: (answers) => {
          return answers.data !== 'tanstack-query';
        },
      },
      {
        target: 'src/lib/providers/data/DataProvider.svelte',
        when: (answers) => {
          return answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
      },
      tailwindThemeFile(),
    ],
    // SvelteKit reserves the `+` prefix, so a suite takes the rest of the name.
    starterTests: [
      ...mockTests(true),
      ...accessorTests(ACCESSORS),
      ...svelteI18nTests(),
      LOCALES_TEST,
      COOKIE_UTILS_TEST,
      {
        target: 'src/routes/page.test.ts',
        covers: 'src/routes/+page.svelte',
        when: (answers) => {
          return !hasStore(answers);
        },
      },
      // The selector is an `$effect`, which runs only while a component initialises.
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
        target: 'src/lib/apis/contact/contactApi.test.ts',
        covers: 'src/lib/apis/contact/contactApi.ts',
      },
    ],
    build: 'vite build',
    // The kit's plugin owns the dev server.
    extraScripts: {
      dev: 'vite dev',
      preview: 'vite preview',
    },
    // `--fail-on-warnings`: a11y diagnostics are compiler warnings, and `eslint-plugin-svelte` v3 has no a11y rule.
    typecheck: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
    prepare: 'svelte-kit sync',
    routerMock: 'fragments/test-setup/setupTests.svelteRouter.ts',
    testDevDependencies: PARTS.svelte.testDevDependencies,
    dependencies: PARTS.svelte.dependencies,
    devDependencies: [
      ...PARTS.svelte.devDependencies,
      '@sveltejs/kit',
      '@sveltejs/adapter-auto',
      'vite',
    ],
    allowBuilds: [],
    stateRules: ['svelte-reactivity.md'],
    i18n: SVELTE_I18N,
  };

  return record;
};
