import { FOLDER_ROUTED, PARTS } from '../constants';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
} from '../utils/mockUtils';
import { sfcNaming } from '../utils/namingUtils';
import { componentStyleModules, componentStyles } from '../utils/styleUtils';
import { ACCESSORS as SOURCE_ACCESSORS, COMPONENTS } from '../vue/constants';

import {
  ACCESSORS,
  ALWAYS,
  FROM_VUE,
  SHARED,
} from './constants';

import type { StarterFile, TargetRecord } from '../types';

/*
 * Vue's meta-framework, and a target rather than a mode on `vue` for the reason `DESIGNv2.md` records: Vue asks no
 * router question and no mode question, so there is no axis to hang it off, and a mode would branch in every
 * field. What it shares with Vue it takes from Vue's own tree rather than a copy.
 *
 * `srcDir` is set to `src/` in `nuxt.config.ts`. Nuxt 4 defaults to `app/`, and one line there is what keeps every
 * glob this CLI writes reading a single source root.
 */
export const nuxtTarget: TargetRecord = {
  id: 'nuxt',
  recordModule: 'src/config/linteljs.ts',
  framework: 'nuxt',
  // No `index.html`: Nuxt renders the document, and there is no entry for one to point at.
  html: false,
  // Nuxt owns Vite internally, so there is no `vite.config.ts` for this CLI to write.
  vite: false,
  sfcExtension: 'vue',
  routeUnit: 'src/pages/, whose files are the routes',
  /*
   * Declared so the dependency is installed and the question is asked, with no counter module yet: this target
   * ships the pages and not the store demo. The same recorded gap astro, webextension and angular carry on `form`.
   */
  stores: ['pinia', 'tanstack-store'],
  // `.nuxt/` is the generated types and the tsconfigs they are read through; `.output/` is what `nuxt build` writes.
  ignores: ['.nuxt/**', '.output/**'],
  naming: sfcNaming('vue'),
  // A dynamic route is `[slug].vue`, so a directory may be one too.
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: { '@composables/*': './src/lib/composables/*' },
  publicDirectory: 'public',
  styleEntry: 'src/styles/main.css',
  starterStyles: [
    '../styles/tokens.css',
    '../styles/base.css',
    '../components/features/app-header/AppHeader.css',
    '../components/ui/app-mark/AppMark.css',
    {
      path: '../components/ui/app-button/AppButton.css',
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
  tailwindTheme: '../styles/theme.css',
  nuxtProject: true,
  // Owns no vite config, so nothing reads this.
  vitePlugin: {
    imports: [],
    calls: [],
  },
  // Vitest runs outside Nuxt's own build, so the SFC transform has to be named for it.
  vitestPlugin: {
    imports: ["import vue from '@vitejs/plugin-vue';"],
    calls: ['vue()'],
  },
  /*
   * Extends the config Nuxt generates, which is where its own `#shared`, `#server` and component paths live, and
   * declares no `paths` of its own so that merged set survives. A project's own aliases reach it the other way,
   * through `alias` in `nuxt.config.ts`, which Nuxt merges rather than replaces. `nuxt typecheck` reads this file.
   */
  tsconfig: {
    jsx: 'preserve',
    extends: './.nuxt/tsconfig.app.json',
    /*
     * `.nuxt/nuxt.d.ts` is named because an extending config replaces `include` rather than adding to it, and that
     * file is where the `*.vue` module shim lives. Without it a relative import of a component resolves to
     * nothing, which is one `import-x/no-unresolved` per single-file component in the project.
     */
    include: ['**/*.vue', '.nuxt/nuxt.d.ts'],
    dropsPaths: true,
  },
  starterFiles: [
    ...mockFiles(),
    ...componentStyles(COMPONENTS),
    // Solid writes the `class` spelling these take; Vue renames two of the four, so each carries its own path.
    ...componentStyleModules('solid', COMPONENTS),
    ...accessorFiles(ACCESSORS, {
      shared: 'vue',
      names: SOURCE_ACCESSORS,
    }),
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
      return {
        target,
        shared: true,
      };
    }),
    // Vue's own views, verbatim: the same markup renders the same page, so it is the same bytes.
    ...FROM_VUE.map((target): StarterFile => {
      return {
        target,
        shared: 'vue',
      };
    }),
    {
      target: 'src/views/HomeView.vue',
    },
    // Tailwind reads the tokens through its own names, which is what `@theme` in this file maps.
    {
      target: 'src/styles/theme.css',
      when: (answers) => {
        return answers.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ],
  starterTests: [
    ...mockTests(),
    ...accessorTests(ACCESSORS, {
      shared: 'vue',
      names: SOURCE_ACCESSORS,
    }),
    {
      target: 'src/views/HomeView.test.ts',
      covers: 'src/views/HomeView.vue',
    },
    {
      target: 'src/views/AboutView.test.ts',
      covers: 'src/views/AboutView.vue',
    },
    {
      target: 'src/views/VersionView.test.ts',
      covers: 'src/views/VersionView.vue',
    },
    {
      target: 'src/components/ui/app-mark/AppMark.test.ts',
      covers: 'src/components/ui/app-mark/AppMark.vue',
    },
    {
      target: 'src/components/features/app-header/AppHeader.test.ts',
      covers: 'src/components/features/app-header/AppHeader.vue',
    },
    {
      target: 'src/pages/index.test.ts',
      covers: 'src/pages/index.vue',
    },
    {
      target: 'src/pages/about.test.ts',
      covers: 'src/pages/about.vue',
    },
    {
      target: 'src/pages/version.test.ts',
      covers: 'src/pages/version.vue',
    },
  ],
  /*
   * Nuxt's own CLI owns all three. `prepare` writes `.nuxt/`, which is where the generated tsconfigs and the route
   * types live, so nothing can typecheck before it has run: it is the postinstall for the same reason SvelteKit's
   * `svelte-kit sync` is.
   */
  build: 'nuxt build',
  extraScripts: {
    dev: 'nuxt dev',
    preview: 'nuxt preview',
    generate: 'nuxt generate',
  },
  typecheck: 'nuxt typecheck',
  prepare: 'nuxt prepare',
  testDevDependencies: PARTS.vue.testDevDependencies,
  dependencies: ['nuxt', ...PARTS.vue.dependencies, 'vue-router'],
  devDependencies: [...PARTS.vue.devDependencies, '@vitejs/plugin-vue'],
  // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses without this.
  allowBuilds: ['vue-demi', 'better-sqlite3', 'esbuild'],
  stateRules: ['vue-reactivity.md'],
};
