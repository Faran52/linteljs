import {
  COMPONENT,
  CONTACT_HOOK_FORMS,
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  DECLARATION_KEY,
  FOLDER_ROUTED,
} from '../constants';
import { CONTACT_PAGE } from '../react/constants';
import { hostedPartsFor } from '../utils/frameworkUtils';
import {
  hasForm,
  hasI18n,
  starterApplies,
} from '../utils/gateUtils';
import {
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
  translated,
} from '../utils/i18nUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  contactSubmitTests,
  filesAt,
  mocked,
} from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ALWAYS,
  ASTRO_I18N,
  COMPONENTS,
  CONTACT_COPY,
  CONTACT_VIEW,
  ISLAND_COMPONENTS,
  SHARED,
  USE_CONTACT_FORM,
  VIEW_SUITES,
} from './constants';
import { astroI18nFiles, astroI18nTests } from './utils/translatedFileUtils';

import type { Answers, HostedFramework } from '@config/types';
import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

// `vite: false`: Astro's Vite options live in `astro.config.mjs`, borrowed through `getViteConfig`.

const INTEGRATIONS: Record<HostedFramework, string> = {
  react: '@astrojs/react',
  vue: '@astrojs/vue',
  svelte: '@astrojs/svelte',
  solid: '@astrojs/solid-js',
};

// Only React hosts the contact page so far; the other frameworks' islands are still to come.
const hasIsland = (answers: Answers): boolean => {
  return hasForm(answers) && answers.hostedFramework === 'react';
};

const onIsland = <T extends StarterFile | StarterTest>(files: readonly T[]): T[] => {
  return files
    .map((file): T => {
      const gated: T = {
        ...file,
        when: (answers: Answers) => {
          return hasIsland(answers) && starterApplies(file, answers);
        },
      };

      return gated;
    });
};

const dataProviders = (): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: 'src/lib/providers/data/DataProvider.tsx',
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
      shared: 'react',
    },
    {
      target: 'src/lib/providers/data/DataProvider.tsx',
      when: (answers) => {
        return answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      shared: 'react',
    },
  ];

  return files;
};

// React's own contact page, as an island: Astro routes `src/pages/`, so its parts move to `src/views/`.
const islandFiles = (): StarterFile[] => {
  return onIsland([
    ...translated<StarterFile>({ target: 'src/pages/contact.astro' })
      .flatMap(mocked),
    ...translated<StarterFile>({ target: `${CONTACT_VIEW}/ContactIsland.tsx` }),
    { target: 'src/components/ui/index.ts' },
    // Under i18n the page reads the words the island hands it; React's own reads react-i18next.
    ...mocked<StarterFile>({
      target: `${CONTACT_VIEW}/ContactPage.tsx`,
      source: `${CONTACT_PAGE}.tsx`,
      when: (answers) => {
        return !hasI18n(answers);
      },
      shared: 'react',
    }),
    {
      target: `${CONTACT_VIEW}/ContactPage.tsx`,
      when: hasI18n,
      variant: 'i18n',
    },
    {
      target: `${CONTACT_COPY}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
    ...CONTACT_HOOK_FORMS
      .map((form): StarterFile => {
        const file: StarterFile = {
          target: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
          source: `src/pages/contact/${USE_CONTACT_FORM}.ts`,
          when: (answers) => {
            return answers.form === form;
          },
          variant: form,
          shared: 'react',
        };

        return file;
      }),
    ...filesAt([
      `${ISLAND_COMPONENTS.button}.tsx`,
      `${ISLAND_COMPONENTS.textInput}.tsx`,
    ], { shared: 'react' }),
    ...componentStyles(ISLAND_COMPONENTS),
    // Astro's own modules already bring the StyleX tokens.
    ...componentStyleModules('react', ISLAND_COMPONENTS)
      .filter(({ variant, target }) => {
        return variant !== 'stylex' || !target.startsWith('src/styles/');
      }),
    ...dataProviders(),
    ...contactApiFiles({ shared: 'react' }),
    ...contactFormFiles(),
    {
      target: 'src/config/routes.ts',
      variant: 'with-form',
      shared: true,
    },
  ]);
};

const islandTests = (): StarterTest[] => {
  const fromReact: StarterTest[] = [
    ISLAND_COMPONENTS.button,
    ISLAND_COMPONENTS.textInput,
    'src/lib/providers/data/DataProvider',
  ]
    .map((stem): StarterTest => {
      const test: StarterTest = {
        target: `${stem}.test.tsx`,
        covers: `${stem}.tsx`,
        shared: 'react',
      };

      return test;
    });

  return onIsland([
    ...fromReact,
    ...['ContactIsland', 'ContactPage']
      .flatMap((name) => {
        return translated<StarterTest>({
          target: `${CONTACT_VIEW}/${name}.test.tsx`,
          covers: `${CONTACT_VIEW}/${name}.tsx`,
        });
      }),
    {
      target: `${CONTACT_COPY}.test.ts`,
      covers: `${CONTACT_COPY}.ts`,
      when: hasI18n,
      variant: 'i18n',
    },
    {
      target: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.test.ts`,
      covers: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
    },
    contactFormTest(),
    ...contactSubmitTests(),
  ]);
};

export const astroTarget: TargetBuilder = (answers) => {
  const framework = answers.hostedFramework;
  const hosted = hostedPartsFor(framework);

  const record: TargetRecord = {
    id: 'astro',
    hostsFramework: true,
    astro: true,
    // The html layer's parser cannot read a template's frontmatter fence.
    html: false,
    // Atoms outlive an island, which is the state problem Astro actually has.
    stores: ['nanostores'],
    ignores: ['.astro/**'],
    gitignore: ['dist/', '.astro/'],
    // `COMPONENT` admits both `Card.astro` and a route's lowercase `index.astro`.
    naming: {
      'src/**/*.astro': COMPONENT,
      ...scriptKeys('pages'),
      ...DECLARATION_KEY,
      ...(hosted === undefined ? {} : { [hosted.componentGlob]: COMPONENT }),
    },
    // A dynamic route is `[slug].astro`, so a directory may be one too.
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    routeAlias: {
      '@layouts/*': './src/layouts/*',
      '@views/*': './src/views/*',
    },
    styleEntry: 'src/styles/global.css',
    starterStyles: [
      './tokens.css',
      './base.css',
      '../components/features/app-header/AppHeader.css',
      '../components/ui/mark/Mark.css',
      {
        path: '../components/ui/button/Button.css',
        when: hasIsland,
      },
      {
        path: '../components/ui/text-input/TextInput.css',
        when: hasIsland,
      },
    ],
    tailwindTheme: './theme.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    // `include` re-names `.astro/types.d.ts` because this replaces the inherited `include`.
    tsconfig: {
      extends: 'astro/tsconfigs/strict',
      types: ['astro/client'],
      include: ['.astro/types.d.ts', '**/*.astro'],
      ...(hosted?.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    vitestFactory: {
      imports: [
        "import { getViteConfig } from 'astro/config';",
        // Its own group, as the import sort keeps a side-effect import.
        '',
        // A bare import: the reference-types directive is banned by this standard.
        "import 'vitest/config';",
      ],
      call: 'getViteConfig',
    },
    ...(hosted?.testConditions === undefined ? {} : { testConditions: hosted.testConditions }),
    // `astro sync` first, since the types `astro check` reads are generated.
    typecheck: 'astro sync && astro check',
    build: 'astro build',
    extraScripts: {
      dev: 'astro dev',
      preview: 'astro preview',
    },
    prepare: 'astro sync',
    publicDirectory: 'public',
    starterFiles: [
      ...mockFiles(hasIsland),
      ...componentStyles(COMPONENTS),
      // An `.astro` template spreads DOM attributes, so it takes Solid's `class` spelling.
      ...componentStyleModules('solid', COMPONENTS),
      ...astroI18nFiles(),
      ...islandFiles(),
      {
        target: 'src/config/routes.ts',
        when: (answers) => {
          return !hasIsland(answers);
        },
        shared: true,
      },
      ...localeFiles(hasIsland),
      languageUtilsFile(),
      COOKIE_UTILS,
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      tailwindThemeFile(),
    ],
    // Astro serves `/about` and `/about/` as one page, so the helper's comparison is real logic.
    starterTests: [
      ...mockTests(),
      ...astroI18nTests(),
      LOCALES_TEST,
      languageUtilsTest(),
      COOKIE_UTILS_TEST,
      ...islandTests(),
      {
        target: 'src/lib/utils/currentPathUtils.test.ts',
        covers: 'src/lib/utils/currentPathUtils.ts',
      },
      ...VIEW_SUITES
        .map((view): StarterTest => {
          const suite: StarterTest = {
            target: `${view}.test.ts`,
            covers: `${view}.astro`,
          };

          return suite;
        }),
    ],
    // Unconditional so `--existing` installs it too.
    dependencies: ['astro', ...(hosted === undefined ? [] : hosted.dependencies)],
    devDependencies: [
      '@astrojs/check',
      'eslint-plugin-astro',
      'astro-eslint-parser',
      ...(framework === undefined ? [] : [INTEGRATIONS[framework]]),
      // With the build plugin `@astrojs/react` brings, so npm dedupes its copy onto the held version.
      ...hosted?.devDependencies ?? [],
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: [...hosted.testDevDependencies] }),
    // Astro's build pulls esbuild, whose install script pnpm refuses without this (ERR_PNPM_IGNORED_BUILDS).
    allowBuilds: ['esbuild', ...hosted?.allowBuilds ?? []],
    stateRules: hosted?.stateRules ?? [],
    i18n: ASTRO_I18N,
  };

  return record;
};
