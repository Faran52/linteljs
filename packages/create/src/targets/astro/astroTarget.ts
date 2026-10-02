import {
  COMPONENT,
  DECLARATION_KEY,
  FOLDER_ROUTED,
} from '../constants';
import { hostedPartsFor } from '../utils/frameworkUtils';
import { localeFiles, LOCALES_TEST } from '../utils/i18nUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import {
  ALWAYS,
  ASTRO_I18N,
  SHARED,
} from './constants';
import { astroI18nFiles, astroI18nTests } from './utils/translatedFileUtils';

import type { HostedFramework } from '@config/types';
import type { TargetBuilder } from '../registry';
import type { StarterFile, TargetRecord } from '../types';

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
    // `COMPONENT` admits both `Card.astro` and a route's lowercase `index.astro`.
    naming: {
      'src/**/*.astro': COMPONENT,
      ...scriptKeys('pages'),
      ...DECLARATION_KEY,
      ...(hosted === undefined ? {} : { [hosted.componentGlob]: COMPONENT }),
    },
    // A dynamic route is `[slug].astro`, so a directory may be one too.
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    routeAlias: { '@layouts/*': './src/layouts/*' },
    // Vitest executes no template, so a module only a page imports would sit at zero.
    coverageExclude: ['src/config/**'],
    styleEntry: 'src/styles/global.css',
    starterStyles: [
      './tokens.css',
      './base.css',
      '../components/features/app-header/AppHeader.css',
      '../components/ui/mark/Mark.css',
      '../components/ui/button/Button.css',
      {
        path: '../components/ui/text-input/TextInput.css',
        when: (answers) => {
          return answers.form !== undefined;
        },
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
      ...mockFiles(false),
      ...componentStyles(),
      // An `.astro` template spreads DOM attributes, so it takes Solid's `class` spelling.
      ...componentStyleModules('solid'),
      ...astroI18nFiles(),
      ...localeFiles(),
      ...ALWAYS
        .map((target): StarterFile => {
          const file: StarterFile = { target };

          return file;
        }),
      ...SHARED
        .map((target): StarterFile => {
          const file: StarterFile = {
            target,
            shared: true,
          };

          return file;
        }),
      {
        target: 'src/styles/theme.css',
        when: (current) => {
          return current.styling === 'tailwind';
        },
        variant: 'tailwind',
        shared: true,
      },
    ],
    // Astro serves `/about` and `/about/` as one page, so the helper's comparison is real logic.
    starterTests: [
      ...mockTests(false),
      ...astroI18nTests(),
      LOCALES_TEST,
      {
        target: 'src/lib/utils/currentPathUtils.test.ts',
        covers: 'src/lib/utils/currentPathUtils.ts',
      },
    ],
    // Unconditional so `--existing` installs it too.
    dependencies: ['astro', ...(hosted === undefined ? [] : hosted.dependencies)],
    devDependencies: [
      '@astrojs/check',
      'eslint-plugin-astro',
      'astro-eslint-parser',
      ...(framework === undefined ? [] : [INTEGRATIONS[framework]]),
      // Less the build plugin, which `@astrojs/react` brings.
      ...(hosted?.devDependencies ?? [])
        .filter((name) => {
          return name !== '@vitejs/plugin-react';
        }),
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: [...hosted.testDevDependencies] }),
    // Astro's build pulls esbuild, whose install script pnpm refuses without this (ERR_PNPM_IGNORED_BUILDS).
    allowBuilds: ['esbuild', ...hosted?.allowBuilds ?? []],
    stateRules: hosted?.stateRules ?? [],
    i18n: ASTRO_I18N,
  };

  return record;
};
