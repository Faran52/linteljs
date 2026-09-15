import { hasLibrary } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { HOOKS_ALIAS, tabsToSpaces } from './utils/targetUtils';

import type { TargetBuilder } from './registry';

// `sv create --template minimal` ships no stylesheet, so `styleEntry` is created here and the root layout imports it.
export const svelte: TargetBuilder = (answers) => {
  return {
    id: 'svelte',
    label: 'Svelte',
    // `--no-add-ons`: every add-on is something lintel emits or excludes, and a half-specified one prompts again.
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
    // Re-declared: an extending config replaces `paths` rather than merging `.svelte-kit/tsconfig.json`'s.
    extraAliases: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
    },
    styleEntry: 'src/app.css',
    // `sveltekit()`, not `svelte()`: the bare plugin fails `vite build` on a missing `index.html`. The adapter is
    // named because this config replaces `sv create`'s own, which otherwise prints "No adapter specified".
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
    // Not `+page.test.ts`: SvelteKit reserves the `+` prefix. The layout is covered rather than excluded; measured,
    // excluding it reported `100% ( 0/0 )`.
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
            // A document with no title is announced by its URL.
            .replace(
              '%sveltekit.head%',
              '<title>App</title>\n\t\t%sveltekit.head%',
            )
            // `text-scale` is not widely available yet.
            .replace(/^[ \t]*<meta name="text-scale"[^>]*>\n/m, ''));
        },
      },
      {
        path: 'src/routes/+layout.svelte',
        // An untyped `$props()` leaves `children` implicitly untyped. The tailwind import goes in here because
        // SvelteKit has no convention that loads a global stylesheet.
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
    // Vite resolves `vite.config.js` first, so the scaffolder's would shadow stage 4's `.ts`.
    staleScaffoldFiles: ['vite.config.js'],
    // `svelte-kit sync` first, since the tsconfig it writes is extended. `--fail-on-warnings`: accessibility
    // diagnostics are compiler warnings, and `eslint-plugin-svelte` v3 carries no a11y rule at all.
    typecheck: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
    prepare: 'svelte-kit sync',
    testDevDependencies: ['@testing-library/svelte'],
    devDependencies: ['eslint-plugin-svelte', 'svelte-eslint-parser', 'svelte-check', 'vite'],
    allowBuilds: [],
    stateRules: ['svelte-reactivity.md'],
  };
};
