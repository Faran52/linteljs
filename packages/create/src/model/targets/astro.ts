import {
  COMPONENT,
  FOLDER_NAMING,
  NAMING,
} from '../naming/naming';

import { partsFor } from './utils/frameworkUtils';

import type { HostedFramework } from '../answers/answers';
import type { TargetBuilder } from './registry';

/**
 * Astro. A content site that renders `.astro` templates on the server, and optionally hydrates islands written in a UI
 * framework, which is why it takes the same `hostedFramework` axis the extension target does rather than being one
 * target per framework. Without one it is templates and plain TypeScript, which is the shape the minimal starter has.
 *
 * `vite: false`, although Astro is a Vite application underneath: its Vite options belong in `astro.config.mjs`, and a
 * second `vite.config.ts` beside it would be read by nothing. That is also why the vitest config goes through
 * `getViteConfig`, the only supported way to borrow the resolved config for a test run.
 */

// The integration that teaches Astro to render a framework's components. One per hosted framework, by Astro's names.
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
    /**
     * `--template minimal` for the same reason every other target takes the smallest official starter: a blog template
     * brings content collections and styling opinions that `repo-structure.astro.md` would then be arguing with.
     * `--no-ai` declines the assistant instructions file it offers, since this CLI writes its own.
     */
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
    // `.astro` is not `.html`, and the html layer's parser cannot read a template's frontmatter fence.
    html: false,
    vite: false,
    routeUnit: 'src/pages/, whose files are the routes',
    // `dist/**` is already a shared ignore; `.astro/` is the generated types and content cache.
    ignores: ['.astro/**'],
    // The `.astro` component rule always; a hosted framework's own component extension on top of it.
    naming: {
      ...NAMING.astro,
      ...(hosted === undefined ? {} : { [hosted.componentGlob]: COMPONENT }),
    },
    folderNaming: FOLDER_NAMING.astro,
    styleEntry: 'src/styles/global.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    /**
     * `astro/tsconfigs/strict` is a package subpath the framework ships, not a generated file: it is what teaches
     * TypeScript about `.astro` modules and the `astro:*` virtual ones. Extended rather than restated, the way
     * SvelteKit's generated config is.
     *
     * Two of its settings are then overridden on purpose. `allowImportingTsExtensions` is turned back off, because this
     * CLI strips relative TypeScript extensions from scaffolded source instead of taking the bundler-only escape hatch.
     * `jsx` stays the base's `preserve`, which is what Astro needs to treat a template as JSX internally; a hosted
     * framework adds only `jsxImportSource`, and only Solid needs one, since `@types/react` already answers for React
     * and the two single-file-component frameworks have no JSX to type.
     *
     * `include` names `.astro/types.d.ts`, which `astro sync` writes and which the base pulls in through
     * `${configDir}`; naming it here keeps it after this config replaces the inherited `include`.
     */
    tsconfig: {
      extends: 'astro/tsconfigs/strict',
      types: ['astro/client'],
      include: ['.astro/types.d.ts', '**/*.astro'],
      ...(hosted?.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    // Empty, like the other targets that own no `vite.config.ts`; see the field on `TargetRecord`.
    vitePlugin: {
      imports: [],
      calls: [],
    },
    // No `vite.config.ts` to merge, so the test run borrows Astro's own resolved config.
    vitestFactory: {
      imports: [
        "import { getViteConfig } from 'astro/config';",
        /**
         * Imported for its types alone: `getViteConfig` takes Vite's `UserConfig`, which has no `test` key, and it is
         * `vitest/config` that declares the augmentation adding one. Without this the config is well-formed and
         * `astro check` still fails it with "'test' does not exist in type 'UserConfig'". A bare import rather than
         * Astro's documented `/// <reference types="vitest" />`, which is a directive this standard bans.
         */
        "import 'vitest/config';",
      ],
      call: 'getViteConfig',
    },
    ...(hosted?.testConditions === undefined ? {} : { testConditions: hosted.testConditions }),
    // `astro check` rather than `tsc --noEmit`: only it knows how to type a template, and it is the same tool Astro's
    // own docs put in a CI gate. `astro sync` first, since the types the check reads are generated.
    typecheck: 'astro sync && astro check',
    build: 'astro build',
    // Generates `.astro/types.d.ts` and the tsconfig the emitted one extends, so it has to run before the gate.
    prepare: 'astro sync',
    /**
     * The minimal starter is one `.astro` page and nothing else, so a fresh project has no measurable source at all and
     * the coverage gate fails on `0/0` before a line is written. This pair is the smallest thing that both fixes that
     * and demonstrates the rule the template cannot: logic lives in `lib/`, where a test can reach it.
     */
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
    /**
     * Astro itself is a runtime dependency: the base template puts it there because the `@astrojs/node` adapter runs
     * it from `dist/server/entry.mjs`, and a second entry in devDependencies only drifts against the first. Declared
     * unconditionally so a `--skip-scaffold` run, whose manifest has neither copy, still installs it.
     */
    dependencies: ['astro', ...(hosted === undefined ? [] : hosted.dependencies)],
    devDependencies: [
      // The type checker `typecheck` calls, and the two packages the `.astro` lint layer loads.
      '@astrojs/check',
      'eslint-plugin-astro',
      'astro-eslint-parser',
      ...(framework === undefined ? [] : [INTEGRATIONS[framework]]),
      /**
       * The hosted framework's own packages, less the build plugin, which belongs to a `vite.config.ts` this target
       * does not own: `@astrojs/react` brings its own copy of `@vitejs/plugin-react` and the compiler rides that
       * plugin's Babel passthrough, so the SWC variant would install and never be imported. The Babel packages stay,
       * because that passthrough is what loads them.
       */
      ...(hosted?.devDependencies ?? []).filter((name) => {
        return name !== '@vitejs/plugin-react-swc';
      }),
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: [...hosted.testDevDependencies] }),
    // Astro's build pulls esbuild, whose install script pnpm refuses to run unless the project says so:
    // without this the very first `pnpm install` aborts with ERR_PNPM_IGNORED_BUILDS.
    allowBuilds: ['esbuild'],
    stateRules: hosted?.stateRules ?? [],
  };
};
