import { hasTests } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import type { TargetRecord } from './record';

export const vue: TargetRecord = {
  id: 'vue',
  label: 'Vue',
  /**
   * `create-vue` skips every prompt once one feature flag is present and treats each unnamed feature as declined, so
   * this list is the whole project shape, not a set of overrides. `--eslint` is deliberately absent: it writes a config
   * stage 2 shadows, plus scripts and devDependencies nothing loads.
   */
  scaffold: (name, answers) => {
    return {
      kind: 'create',
      args: [
        'vue@latest', name,
        '--ts',
        '--router',
        ...(answers.store ? ['--pinia'] : []),
        ...(hasTests(answers) ? ['--vitest'] : []),
      ],
    };
  },
  framework: 'vue',
  html: true,
  vite: true,
  sfcExtension: 'vue',
  routeUnit: 'src/views/, routed from src/router/',
  hooksSlot: {
    label: 'Composables',
    path: 'src/lib/composables/ (use*)',
  },
  // No dependency: the scaffold flag above has create-vue install Pinia itself.
  store: { label: 'Pinia' },
  ignores: [],
  naming: NAMING.vue,
  folderNaming: FOLDER_NAMING.vue,
  hooksAlias: { '@composables/*': './src/lib/composables/*' },
  styleEntry: 'src/assets/main.css',
  vitePlugin: {
    imports: ["import vue from '@vitejs/plugin-vue';"],
    calls: ['vue()'],
  },
  tsconfig: {
    jsx: 'preserve',
    include: ['**/*.vue'],
  },
  // One mount of `App` with the real router walks the whole welcome tree; the store test covers the one module the demo
  // never renders, and its `covers` gate skips it where the store answer declined `--pinia`.
  starterTests: [
    {
      source: 'starter/vue/App.test.ts',
      target: 'src/App.test.ts',
      covers: 'src/App.vue',
    },
    {
      source: 'starter/vue/counter.test.ts',
      target: 'src/lib/store/counter.test.ts',
      covers: 'src/lib/store/counter.ts',
    },
  ],
  starterFixes: [
    {
      // `<html lang="">` fails require-lang: an empty lang tells a screen reader the language is unknown, worse than
      // omitting it, and the generator left it for the author to fill in.
      path: 'index.html',
      transform: (source) => {
        return source.replace('<html lang="">', '<html lang="en">');
      },
    },
    {
      // `create-vue` points its logo at `@/assets/logo.svg`, an alias stages 3 and 4 replace; lintel's alias set has no
      // `@/` on purpose, and in a template `src` attribute only `vite build` (not ESLint or `vue-tsc`) catches it.
      path: 'src/App.vue',
      transform: (source) => {
        return source.replace('"@/assets/', '"./assets/');
      },
    },
    {
      // The Pinia demo store, moved to where `repo-structure.md` says a store goes; nothing in `create-vue`'s output
      // imports it, so the move is the whole repair. Absent without `--pinia`, which `repair` skips over.
      path: 'src/stores/counter.ts',
      moveTo: 'src/lib/store/counter.ts',
    },
    {
      // Two `:root` blocks in one file fails `no-duplicate-selectors`, which has no fixer; they hold the same kind of
      // declaration and the generator's own comment separates them.
      path: 'src/assets/base.css',
      transform: (source) => {
        return source.replace(
          /}\n\n(\/\* semantic color variables for this project \*\/)\n:root \{\n/,
          '\n  $1\n',
        );
      },
    },
  ],
  staleScaffoldFiles: ['tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.vitest.json'],
  typecheck: 'vue-tsc --noEmit',
  // Declared rather than inherited from `create-vue --vitest`: `testing.vue.md` names it as the rendering library, and
  // a rule file may not depend on another generator's choice holding.
  testDevDependencies: ['@vue/test-utils'],
  devDependencies: ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility', 'vue-eslint-parser', 'vue-tsc'],
  allowBuilds: [],
  stateRules: ['vue-reactivity.md'],
};
