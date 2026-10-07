import {
  COMPONENT,
  COOKIE_UTILS,
  COOKIE_UTILS_TEST,
  DECLARATION_KEY,
  FOLDER_ROUTED,
} from '../constants';
import { hostedPartsFor } from '../utils/frameworkUtils';
import {
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
} from '../utils/i18nUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';
import { filesAt } from '../utils/starterUtils';
import {
  componentStyleModules,
  componentStyles,
  tailwindThemeFile,
} from '../utils/styleUtils';

import {
  ALWAYS,
  ASTRO_I18N,
  COMPONENTS,
  SHARED,
  VIEW_SUITES,
} from './constants';
import {
  hasIsland,
  islandFiles,
  islandSheets,
  islandTests,
} from './utils/islandUtils';
import { astroI18nFiles, astroI18nTests } from './utils/translatedFileUtils';

import type { HostedFramework } from '@config/types';
import type { TargetBuilder } from '../registry';
import type { StarterTest, TargetRecord } from '../types';

// `vite: false`: Astro's Vite options live in `astro.config.mjs`, borrowed through `getViteConfig`.

const INTEGRATIONS: Record<HostedFramework, string> = {
  react: '@astrojs/react',
  vue: '@astrojs/vue',
  svelte: '@astrojs/svelte',
  solid: '@astrojs/solid-js',
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
    ...(hosted?.sfcExtension === undefined ? {} : { sfcExtension: hosted.sfcExtension }),
    // `include` re-names `.astro/types.d.ts` because this replaces the inherited `include`.
    tsconfig: {
      extends: 'astro/tsconfigs/strict',
      types: ['astro/client'],
      include: [
        '.astro/types.d.ts',
        '**/*.astro',
        ...(hosted?.sfcExtension === undefined ? [] : [`**/*.${hosted.sfcExtension}`]),
      ],
      ...(hosted?.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    vitestFactory: framework === 'solid'
      ? {
          imports: [
            "import { getViteConfig } from 'astro/config';",
            "import solid from 'vite-plugin-solid';",
            "import { defineConfig } from 'vitest/config';",
          ],
          call: 'getViteConfig',
          swap: {
            name: 'solid',
            call: 'solid({ hot: false, ssr: true })',
          },
        }
      : {
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
    ...(framework === 'solid' ? { testInline: [/solid-js/] } : {}),
    // Svelte's island reads SvelteKit's own spelling of `src/lib`.
    ...(framework === 'svelte' ? { packageImports: { '#lib/*': './src/lib/*' } } : {}),
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
