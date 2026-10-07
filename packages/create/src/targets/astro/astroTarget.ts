import { keysOf } from '@utils/objectUtils';

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
  REACT_ISLAND_IMPORT,
  SHARED,
  USE_CONTACT_FORM,
  VIEW_SUITES,
} from './constants';
import { astroI18nFiles, astroI18nTests } from './utils/translatedFileUtils';

import type {
  Answers,
  HostedFramework,
  TargetId,
} from '@config/types';
import type { TargetBuilder } from '../registry';
import type {
  ConditionalStyle,
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

interface Island {
  // The line `pages/contact.astro` imports the island through.
  pageImport: string;
  files: StarterFile[];
  tests: StarterTest[];
}

type IslandHost = keyof typeof ISLAND_COMPONENTS;

// `vite: false`: Astro's Vite options live in `astro.config.mjs`, borrowed through `getViteConfig`.

const INTEGRATIONS: Record<HostedFramework, string> = {
  react: '@astrojs/react',
  vue: '@astrojs/vue',
  svelte: '@astrojs/svelte',
  solid: '@astrojs/solid-js',
};

const gated = <T extends StarterFile | StarterTest>(on: (answers: Answers) => boolean, files: readonly T[]): T[] => {
  return files
    .map((file): T => {
      const gatedFile: T = {
        ...file,
        when: (answers: Answers) => {
          return on(answers) && starterApplies(file, answers);
        },
      };

      return gatedFile;
    });
};

// A suite beside each file, from the framework's own tree.
const suitesOf = (covered: readonly string[], shared: TargetId): StarterTest[] => {
  return covered
    .map((covers): StarterTest => {
      const test: StarterTest = {
        target: covers
          .replace(/\.(?:ts|vue)$/u, '.test.ts')
          .replace(/\.tsx$/u, '.test.tsx'),
        covers,
        shared,
      };

      return test;
    });
};

const dataProviders = (path: string, shared: TargetId): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: path,
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
      shared,
    },
    {
      target: path,
      when: (answers) => {
        return answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      shared,
    },
  ];

  return files;
};

// React's own contact page, as an island: Astro routes `src/pages/`, so its parts move to `src/views/`.
const reactIsland = (): Island => {
  const { button, textInput } = ISLAND_COMPONENTS.react;

  const island: Island = {
    pageImport: REACT_ISLAND_IMPORT,
    files: [
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
      ...filesAt([`${button}.tsx`, `${textInput}.tsx`], { shared: 'react' }),
      ...dataProviders('src/lib/providers/data/DataProvider.tsx', 'react'),
      ...contactApiFiles({ shared: 'react' }),
    ],
    tests: [
      ...suitesOf([
        `${button}.tsx`,
        `${textInput}.tsx`,
        'src/lib/providers/data/DataProvider.tsx',
      ], 'react'),
      ...['ContactIsland', 'ContactPage']
        .flatMap((name) => {
          return translated<StarterTest>({
            target: `${CONTACT_VIEW}/${name}.test.tsx`,
            covers: `${CONTACT_VIEW}/${name}.tsx`,
          });
        }),
      {
        target: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.test.ts`,
        covers: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
      },
    ],
  };

  return island;
};

// Vue's contact view already sits under `src/views/`; only the island and the view it translates are Astro's.
const vueIsland = (): Island => {
  const { button, textInput } = ISLAND_COMPONENTS.vue;
  const fromVue = [
    `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
    `${button}.vue`,
    `${textInput}.vue`,
  ];
  const view = `${CONTACT_VIEW}/ContactView`;

  const island: Island = {
    pageImport: "import ContactIsland from '@views/contact/ContactIsland.vue';",
    files: [
      ...translated<StarterFile>({ target: `${CONTACT_VIEW}/ContactIsland.vue` }),
      ...mocked<StarterFile>({
        target: `${view}.vue`,
        when: (answers) => {
          return !hasI18n(answers);
        },
        shared: 'vue',
      }),
      {
        target: `${view}.vue`,
        when: hasI18n,
        variant: 'i18n',
      },
      ...filesAt([...fromVue, 'src/components/ui/text-input/types.ts'], { shared: 'vue' }),
      ...dataProviders('src/lib/providers/data/dataProvider.ts', 'vue'),
      ...contactApiFiles({ query: 'vue' }),
    ],
    tests: [
      ...suitesOf([
        ...fromVue,
        'src/lib/apis/contact/contactApi.ts',
        'src/lib/providers/data/dataProvider.ts',
      ], 'vue'),
      ...translated<StarterTest>({
        target: `${CONTACT_VIEW}/ContactIsland.test.ts`,
        covers: `${CONTACT_VIEW}/ContactIsland.vue`,
      }),
      {
        target: `${view}.test.ts`,
        covers: `${view}.vue`,
        when: (answers) => {
          return !hasI18n(answers);
        },
        shared: 'vue',
      },
      {
        target: `${view}.test.ts`,
        covers: `${view}.vue`,
        when: hasI18n,
        variant: 'i18n',
      },
    ],
  };

  return island;
};

const ISLANDS: Record<IslandHost, () => Island> = {
  react: reactIsland,
  vue: vueIsland,
};

// Svelte's and Solid's islands are still to come, so a project hosting either has no contact page.
const hasIsland = (answers: Answers): boolean => {
  const host = answers.hostedFramework;

  return hasForm(answers) && host !== undefined && Object.hasOwn(ISLANDS, host);
};

const hosts = (host: IslandHost) => {
  return (answers: Answers): boolean => {
    return hasForm(answers) && answers.hostedFramework === host;
  };
};

const islandFiles = (): StarterFile[] => {
  const own = keysOf(ISLANDS)
    .flatMap((host) => {
      const { pageImport, files } = ISLANDS[host]();
      const components = ISLAND_COMPONENTS[host];
      const pages = translated<StarterFile>({
        target: 'src/pages/contact.astro',
        transform: (source) => {
          return source.replace(REACT_ISLAND_IMPORT, pageImport);
        },
      })
        .flatMap(mocked);

      const gatedFiles = gated(hosts(host), [
        ...pages,
        ...files,
        ...componentStyles(components),
        // Astro's own modules already bring the StyleX tokens.
        ...componentStyleModules(host === 'react' ? 'react' : 'solid', components)
          .filter(({ variant, target }) => {
            return variant !== 'stylex' || !target.startsWith('src/styles/');
          }),
      ]);

      return gatedFiles;
    });

  const all = [
    ...own,
    ...gated(hasIsland, [
      {
        target: `${CONTACT_COPY}.ts`,
        when: hasI18n,
        variant: 'i18n',
      },
      ...contactFormFiles(),
      {
        target: 'src/config/routes.ts',
        variant: 'with-form',
        shared: true,
      },
    ]),
  ];

  return all;
};

const islandTests = (): StarterTest[] => {
  const own = keysOf(ISLANDS)
    .flatMap((host) => {
      const gatedTests = gated(hosts(host), ISLANDS[host]().tests);

      return gatedTests;
    });

  const all = [
    ...own,
    ...gated(hasIsland, [
      {
        target: `${CONTACT_COPY}.test.ts`,
        covers: `${CONTACT_COPY}.ts`,
        when: hasI18n,
        variant: 'i18n',
      },
      contactFormTest(),
      ...contactSubmitTests(),
    ]),
  ];

  return all;
};

// Each island's button and text input sheets, under its own host.
const islandSheets = (): ConditionalStyle[] => {
  return keysOf(ISLAND_COMPONENTS)
    .flatMap((host) => {
      return Object.values(ISLAND_COMPONENTS[host])
        .map((path): ConditionalStyle => {
          const sheet: ConditionalStyle = {
            path: `${path.replace(/^src\//u, '../')}.css`,
            when: hosts(host),
          };

          return sheet;
        });
    });
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
      ...islandSheets(),
    ],
    tailwindTheme: './theme.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    // `include` re-names `.astro/types.d.ts` because this replaces the inherited `include`.
    tsconfig: {
      extends: 'astro/tsconfigs/strict',
      types: ['astro/client'],
      include: [
        '.astro/types.d.ts',
        '**/*.astro',
        ...(framework === 'vue' ? ['**/*.vue'] : []),
      ],
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
