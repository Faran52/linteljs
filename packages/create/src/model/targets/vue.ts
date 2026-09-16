import { hasTests } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import type { TargetRecord } from './record';

export const vue: TargetRecord = {
  id: 'vue',
  label: 'Vue',
  // One feature flag makes `create-vue` treat every unnamed feature as declined, so this list is the whole shape.
  // `--eslint` is absent: it writes a config stage 2 shadows.
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
  // No dependency: create-vue installs Pinia itself.
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
  // Mounting `App` with the real router walks the welcome tree; the store test covers the one module never rendered.
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
      // An empty `lang` tells a screen reader the language is unknown, worse than omitting it.
      path: 'index.html',
      transform: (source) => {
        return source.replace('<html lang="">', '<html lang="en">');
      },
    },
    {
      // `@/assets/logo.svg` uses an alias stages 3 and 4 replace, and only `vite build` catches it in a `src`.
      path: 'src/App.vue',
      transform: (source) => {
        return source.replace('"@/assets/', '"./assets/');
      },
    },
    {
      // Moved to where `repo-structure.md` says a store goes; nothing imports it. Absent without `--pinia`.
      path: 'src/stores/counter.ts',
      moveTo: 'src/lib/store/counter.ts',
    },
    {
      // Two `:root` blocks fail `no-duplicate-selectors`, which has no fixer.
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
  // Declared rather than inherited from `--vitest`: `testing.vue.md` names it, and a rule file may not depend on
  // another generator's choice.
  testDevDependencies: ['@vue/test-utils'],
  devDependencies: ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility', 'vue-eslint-parser', 'vue-tsc', 'vite'],
  // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses without this.
  allowBuilds: ['vue-demi'],
  stateRules: ['vue-reactivity.md'],
};
