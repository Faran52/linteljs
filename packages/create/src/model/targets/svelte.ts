import { hasLibrary } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { HOOKS_ALIAS, tabsToSpaces } from './utils/targetUtils';

import type { TargetBuilder } from './registry';

/**
 * The one target whose scaffolder ships no stylesheet: `sv create --template minimal` writes four source files and
 * none of them is CSS. So `styleEntry` here is a file this CLI creates rather than one it finds, and the tailwind
 * answer additionally has to import it from the root layout, which is SvelteKit's only place for global CSS.
 */
export const svelte: TargetBuilder = (answers) => {
  return {
    id: 'svelte',
    label: 'Svelte',
    // `--no-add-ons`: every add-on `sv` offers is something lintel already emits or excludes, and a half-specified one
    // prompts again for its own options. `--types ts` rather than the `jsdoc` its other choice offers.
    scaffold: (name) => {
      return {
        kind: 'dlx',
        args: [
          'sv', 'create', name,
          '--template', 'minimal',
          '--types', 'ts',
          '--no-add-ons',
          '--no-install',
        ],
      };
    },
    framework: 'svelte',
    html: true,
    vite: true,
    sfcExtension: 'svelte',
    routeUnit: 'src/routes/',
    hooksSlot: {
      label: 'Hooks',
      path: 'src/lib/hooks/',
    },
    ignores: ['.svelte-kit/**'],
    naming: NAMING.svelte,
    folderNaming: FOLDER_NAMING.svelte,
    hooksAlias: HOOKS_ALIAS,
    // SvelteKit's own, re-declared: an extending config replaces `paths` rather than merging it, and
    // `.svelte-kit/tsconfig.json` is where `$lib` otherwise comes from.
    extraAliases: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
    },
    // Created by this CLI rather than found: see the note above the builder.
    styleEntry: 'src/app.css',
    /**
     * `sveltekit()`, not the bare `svelte()` a host would use: the kit plugin owns the entry too, routing through
     * `src/routes/` and resolving `$app`/`$lib`, and the bare plugin fails `vite build` on a missing `index.html`.
     * The adapter argument matters because this config replaces `sv create`'s own; dropping it leaves
     * `@sveltejs/adapter-auto` installed and unreferenced, and `pnpm build` printing "No adapter specified".
     */
    vitePlugin: {
      imports: [
        "import adapter from '@sveltejs/adapter-auto';",
        "import { sveltekit } from '@sveltejs/kit/vite';",
      ],
      calls: ['sveltekit({ adapter: adapter() })'],
    },
    tsconfig: {
      extends: './.svelte-kit/tsconfig.json',
      include: ['**/*.svelte'],
    },
    testConditions: ['browser'],
    /**
     * Not `+page.test.ts`/`+layout.test.ts`: SvelteKit reserves the `+` prefix in `src/routes/` and warns the file
     * isn't a recognised route. The layout is covered rather than excluded like Next's root layout: measured,
     * excluding it reported `100% ( 0/0 )` on all four metrics, passing while asserting nothing; included, 4/4
     * statements, 3/3 functions, 2/2 lines.
     */
    starterTests: [
      {
        source: 'starter/svelte/page.test.ts',
        target: 'src/routes/page.test.ts',
        covers: 'src/routes/+page.svelte',
      },
      {
        source: 'starter/svelte/layout.test.ts',
        target: 'src/routes/layout.test.ts',
        covers: 'src/routes/+layout.svelte',
      },
    ],
    starterFixes: [
      {
        path: 'src/app.html',
        transform: (source) => {
          return tabsToSpaces(source
            // require-title: a document with no title is announced by its URL.
            .replace(
              '%sveltekit.head%',
              '<title>App</title>\n\t\t%sveltekit.head%',
            )
            // use-baseline: `text-scale` is not widely available yet, and nothing in the starter depends on it.
            .replace(/^[ \t]*<meta name="text-scale"[^>]*>\n/m, ''));
        },
      },
      {
        path: 'src/routes/+layout.svelte',
        /**
         * `$props()` with no type annotation makes `children` implicitly untyped (no-unsafe-call); `--types ts`
         * above is what guarantees the `<script lang="ts">` the annotation needs.
         * The tailwind answer also imports the stylesheet this CLI wrote: SvelteKit has no convention that loads it,
         * so without the import Tailwind is installed, configured and generating nothing.
         */
        transform: (source) => {
          const typed = tabsToSpaces(source).replace(
            'let { children } = $props();',
            "import type { Snippet } from 'svelte';\n\n  let { children }: { children: Snippet } = $props();",
          );

          if (!hasLibrary(answers, 'tailwind')) {
            return typed;
          }

          return typed.replace(
            "import type { Snippet } from 'svelte';",
            "import '../app.css';\n\n  import type { Snippet } from 'svelte';",
          );
        },
      },
      {
        path: 'src/routes/+page.svelte',
        transform: tabsToSpaces,
      },
    ],
    // `sv create` always names its config `vite.config.js`; Vite resolves `.js` first, so leaving it beside stage 4's
    // `vite.config.ts` would run the scaffolder's config and ignore lintel's.
    staleScaffoldFiles: ['vite.config.js'],
    // `svelte-kit sync` first: it regenerates `.svelte-kit/tsconfig.json`, which the emitted tsconfig extends and which
    // drifts after a route file is added or renamed.
    /**
     * `--fail-on-warnings` because Svelte's accessibility diagnostics are compiler warnings, and `svelte-check` exits
     * 0 on a warning by default: without it an `<img>` with no `alt` prints and the gate passes. `eslint-plugin-svelte`
     * v3 carries no accessibility rule at all (85 rules, none of them a11y), so the compiler is the only thing that
     * checks a template, and this flag is the only thing that makes what it finds count.
     */
    typecheck: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
    prepare: 'svelte-kit sync',
    testDevDependencies: ['@testing-library/svelte'],
    devDependencies: ['eslint-plugin-svelte', 'svelte-eslint-parser', 'svelte-check'],
    allowBuilds: [],
    stateRules: ['svelte-reactivity.md'],
  };
};
