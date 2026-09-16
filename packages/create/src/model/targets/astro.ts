import {
  COMPONENT,
  FOLDER_NAMING,
  NAMING,
} from '../naming/naming';

import { partsFor } from './utils/frameworkUtils';

import type { HostedFramework } from '../answers/answers';
import type { TargetBuilder } from './registry';

// Templates on the server, optionally hydrating islands in a hosted framework. `vite: false` although Astro runs on
// Vite: its Vite options live in `astro.config.mjs`, so the test run borrows them through `getViteConfig`.

// Astro's integration per hosted framework.
const INTEGRATIONS: Record<HostedFramework, string> = {
  react: '@astrojs/react',
  vue: '@astrojs/vue',
  svelte: '@astrojs/svelte',
  solid: '@astrojs/solid-js',
};

export const astro: TargetBuilder = (answers) => {
  const framework = answers.hostedFramework;
  const hosted = framework === undefined ? undefined : partsFor(framework);

  return {
    id: 'astro',
    label: 'Astro',
    // `minimal`, like every target's smallest starter; `--no-ai` declines the assistant file this CLI writes itself.
    scaffold: (name) => {
      return {
        kind: 'create',
        args: [
          'astro@latest', name,
          '--template', 'minimal',
          '--no-install',
          '--no-git',
          '--no-ai',
          '--skip-houston',
          '--yes',
        ],
      };
    },
    hostsFramework: true,
    astro: true,
    // The html layer's parser cannot read a template's frontmatter fence.
    html: false,
    vite: false,
    routeUnit: 'src/pages/, whose files are the routes',
    // `.astro/` is the generated types and content cache.
    ignores: ['.astro/**'],
    naming: {
      ...NAMING.astro,
      ...(hosted === undefined ? {} : { [hosted.componentGlob]: COMPONENT }),
    },
    folderNaming: FOLDER_NAMING.astro,
    styleEntry: 'src/styles/global.css',
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
    // The minimal starter has no measurable source, so coverage fails on `0/0`; this pair is the smallest fix.
    starterFiles: [
      {
        source: 'starter/astro/formatDate.ts',
        target: 'src/lib/utils/formatDate.ts',
      },
    ],
    starterTests: [
      {
        source: 'starter/astro/formatDate.test.ts',
        target: 'src/lib/utils/formatDate.test.ts',
        covers: 'src/lib/utils/formatDate.ts',
      },
    ],
    // Runtime, where the base template puts it for the `@astrojs/node` adapter; unconditional so `--skip-scaffold`
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
    allowBuilds: ['esbuild'],
    stateRules: hosted?.stateRules ?? [],
  };
};
