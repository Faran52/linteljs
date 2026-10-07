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
} from '../utils/mockUtils';
import { sfcNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
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
  FORM_SUITE_MOCKS,
  QUERY_CONTEXT_MOCKS,
  SHARED,
  SVELTE_I18N,
} from './constants';
import { svelteI18nFiles, svelteI18nTests } from './utils/translatedFileUtils';

import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
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
    gitignore: [
      '.output',
      '.vercel',
      '.netlify',
      '.wrangler',
      '/.svelte-kit',
      '/build',
      '!.env.test',
      'vite.config.js.timestamp-*',
      'vite.config.ts.timestamp-*',
    ],
    naming: sfcNaming('svelte', 'routes'),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: HOOKS_ALIAS,
    // No bare `#lib`: the starter has no `src/lib/index.ts` for it to name.
    packageImports: { '#lib/*': './src/lib/*' },
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
      // Runes everywhere but `node_modules`, as `sv create` writes it: a legacy-mode component fails to compile.
      calls: [
        [
          'sveltekit({',
          '      adapter: adapter(),',
          '      compilerOptions: {',
          '        runes: ({ filename }) => {',
          String.raw`          const parts = filename.split(/[/\\]/u);`,
          '',
          "          return parts.includes('node_modules') ? undefined : true;",
          '        },',
          '      },',
          '    })',
        ].join('\n'),
      ],
    },
    // Our `types` replaces the kit's, and `$app/types` is where its ambient modules and `RouteId` live.
    tsconfig: {
      extends: '$app/tsconfig',
      include: ['**/*.svelte'],
      types: ['$app/types'],
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
      ...localeFiles(hasForm),
      languageUtilsFile(),
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
      ...translated<StarterFile>({
        target: 'src/routes/+page.svelte',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      ...translated<StarterFile>({
        target: 'src/routes/+page.svelte',
        when: hasStore,
        variant: 'with-store',
      }),
      { target: 'src/components/ui/button/Button.svelte' },
      ...filesAt(FORM_FILES, {
        when: hasForm,
      }),
      ...contactApiFiles(),
      ...filesAt(FORM_SUITE_MOCKS, {
        when: (answers) => {
          return hasForm(answers) && hasTests(answers);
        },
      }),
      ...contactFormFiles(),
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
      ...mockTests(),
      ...accessorTests(ACCESSORS),
      ...svelteI18nTests(),
      LOCALES_TEST,
      languageUtilsTest(),
      COOKIE_UTILS_TEST,
      ...translated<StarterTest>({
        target: 'src/routes/page.test.ts',
        covers: 'src/routes/+page.svelte',
        when: (answers) => {
          return !hasStore(answers);
        },
      }),
      // The selector is an `$effect`, which runs only while a component initialises.
      ...translated<StarterTest>({
        target: 'src/routes/page.test.ts',
        covers: 'src/routes/+page.svelte',
        when: hasStore,
        variant: 'with-store',
      }),
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
        target: 'src/routes/contact/use-contact-form/useContactForm.test.ts',
        covers: 'src/routes/contact/use-contact-form/useContactForm.ts',
      },
      {
        target: 'src/components/ui/text-input/TextInput.test.ts',
        covers: 'src/components/ui/text-input/TextInput.svelte',
      },
      // The TanStack Query wrapper needs a component to run in, so the Contact page's suite covers it.
      {
        target: 'src/lib/apis/contact/contactApi.test.ts',
        covers: 'src/lib/apis/contact/contactApi.ts',
        when: (answers) => {
          return answers.data === undefined;
        },
      },
      contactFormTest(),
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
