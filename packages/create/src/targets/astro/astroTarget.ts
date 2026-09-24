import {
  COMPONENT,
  DECLARATION_KEY,
  FOLDER_ROUTED,
} from '../constants';
import { partsFor } from '../utils/frameworkUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';

import { ALWAYS, SHARED } from './constants';

import type { HostedFramework } from '@answers/target/hosted-framework/hostedFrameworkAnswer';
import type { TargetBuilder } from '../registry';
import type { StarterFile } from '../types';

// Templates on the server, optionally hydrating islands in a hosted framework. `vite: false` although Astro runs on
// Vite: its Vite options live in `astro.config.mjs`, so the test run borrows them through `getViteConfig`.

// Astro's integration per hosted framework.
const INTEGRATIONS: Record<HostedFramework, string> = {
  react: '@astrojs/react',
  vue: '@astrojs/vue',
  svelte: '@astrojs/svelte',
  solid: '@astrojs/solid-js',
};

export const astroTarget: TargetBuilder = (answers) => {
  const framework = answers.hostedFramework;
  const hosted = framework === undefined ? undefined : partsFor(framework);

  return {
    id: 'astro',
    recordModule: 'src/config/linteljs.ts',
    hostsFramework: true,
    astro: true,
    // The html layer's parser cannot read a template's frontmatter fence.
    html: false,
    vite: false,
    routeUnit: 'src/pages/, whose files are the routes',
    // `.astro/` is the generated types and content cache.
    // Atoms outlive an island, which is the state problem Astro actually has.
    stores: ['nanostores'],
    ignores: ['.astro/**'],
    // `COMPONENT` admits both `Card.astro` and the lowercase `index.astro` a route has to be; `pages` is the route
    // directory.
    naming: {
      'src/**/*.astro': COMPONENT,
      ...scriptKeys('pages'),
      ...DECLARATION_KEY,
      ...(hosted === undefined ? {} : { [hosted.componentGlob]: COMPONENT }),
    },
    // A dynamic route is `[slug].astro`, so a directory may be one too.
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    /*
     * Data a template reads, and vitest executes no template: a `.astro` file is not in the coverage include
     * because nothing here can run one. Astro's own container API would let a suite render a page, which is the
     * way to take these back into the measurement; until then a module only a page imports sits at zero and says
     * nothing about whether the project works.
     */
    coverageExclude: ['src/config/**', 'src/config/linteljs.ts'],
    styleEntry: 'src/styles/global.css',
    starterStyles: [
      './tokens.css',
      './base.css',
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
    tailwindTheme: './theme.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    /**
     * `astro/tsconfigs/strict` teaches TypeScript about `.astro` and `astro:*` modules. `allowImportingTsExtensions`
     * goes back off because this CLI strips the extensions instead; `jsx` stays `preserve`, which Astro needs.
     * `include` re-names `.astro/types.d.ts` because this config replaces the inherited `include`.
     */
    tsconfig: {
      extends: 'astro/tsconfigs/strict',
      types: ['astro/client'],
      include: ['.astro/types.d.ts', '**/*.astro'],
      ...(hosted?.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    vitePlugin: {
      imports: [],
      calls: [],
    },
    // No `vite.config.ts` to merge, so the test run borrows Astro's resolved config.
    vitestFactory: {
      imports: [
        "import { getViteConfig } from 'astro/config';",
        // Types only: `vitest/config` declares the `test` key `astro check` otherwise rejects on `UserConfig`.
        // A bare import, since the `/// <reference types>` directive is one this standard bans.
        "import 'vitest/config';",
      ],
      call: 'getViteConfig',
    },
    ...(hosted?.testConditions === undefined ? {} : { testConditions: hosted.testConditions }),
    // Only `astro check` can type a template; `astro sync` first, since the types it reads are generated.
    typecheck: 'astro sync && astro check',
    build: 'astro build',
    prepare: 'astro sync',
    publicDirectory: 'public',
    starterFiles: [
      ...mockFiles(),
      ...componentStyles(),
      // An `.astro` template spreads DOM attributes, so it takes Solid's `class` spelling from `stylex.attrs`.
      ...componentStyleModules('solid'),
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
        target: 'src/styles/theme.css',
        when: (current) => {
          return current.styling === 'tailwind';
        },
        variant: 'tailwind',
        shared: true,
      },
    ],
    /*
     * A `.astro` file is not in the coverage include, because vitest cannot execute one, so the helper the header
     * calls is what the measurement is made of. It is real logic rather than a placeholder: Astro serves `/about`
     * and `/about/` as the same page, and a header comparing the strings would mark neither.
     */
    starterTests: [
      ...mockTests(),
      {
        target: 'src/lib/utils/currentPath.test.ts',
        covers: 'src/lib/utils/currentPath.ts',
      },
    ],
    // Runtime, where the base template puts it for the `@astrojs/node` adapter; unconditional so `--existing`
    // installs it too.
    dependencies: ['astro', ...(hosted === undefined ? [] : hosted.dependencies)],
    devDependencies: [
      '@astrojs/check',
      'eslint-plugin-astro',
      'astro-eslint-parser',
      ...(framework === undefined ? [] : [INTEGRATIONS[framework]]),
      // Less the build plugin: `@astrojs/react` brings its own `@vitejs/plugin-react`, and the compiler rides its
      // Babel passthrough, which is what still loads the Babel packages.
      ...(hosted?.devDependencies ?? []).filter((name) => {
        return name !== '@vitejs/plugin-react' && name !== '@rolldown/plugin-babel';
      }),
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: [...hosted.testDevDependencies] }),
    // Astro's build pulls esbuild, whose install script pnpm refuses without this (ERR_PNPM_IGNORED_BUILDS).
    allowBuilds: ['esbuild', ...hosted?.allowBuilds ?? []],
    stateRules: hosted?.stateRules ?? [],
  };
};
