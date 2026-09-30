import {
  type AliasMap,
  type HostedFramework,
  type NamingMap,
} from '@config/types';

import type { FrameworkParts, PluginSpec } from './types';

const KEBAB = '+([a-z0-9])*(-+([a-z0-9]))';

// Everything except camelCase, so `[slug]`, `(tabs)`, `_layout` and `+page@(app)` pass.
export const COMPONENT = '!([a-z]*[A-Z]*)';

// Kebab-case or camelCase, so `vite-env.d.ts` and `assets.d.ts` both pass.
export const DECLARATION = `@(${KEBAB}|+([a-z])*([a-zA-Z0-9]))`;

// `__tests__` is reserved by every framework's tooling.
export const FOLDER = `@(${KEBAB}|__tests__)`;

export const FOLDER_ROUTED = String.raw`@(${KEBAB}|__tests__|\[*\]|\(*\)|{*})`;

// Its own key: `src/**/*.ts` matches `vite-env.d.ts`, and two keys on one file must agree.
export const DECLARATION_KEY: NamingMap = { 'src/**/*.d.ts': DECLARATION };

// Every folder, so the shipped `scripts/utils/` and hook helpers are held to it too.
export const UTILS_KEY: NamingMap = { '**/utils/*.ts': '*Utils' };

// Off for the test run: the React Compiler's memo cache and Solid's HMR handler leave uncovered branches.
// `process.env.VITEST`, not `mode`, because a function config cannot be merged.
export const OUTSIDE_TESTS = 'process.env.VITEST === undefined';

export const ROUTER_MOCK = 'fragments/test-setup/setupTests.router.ts';

// docs/DESIGN.md has why `oxc-transform-react` replaced the Babel pass.
export const REACT_VITE_PLUGIN: PluginSpec = {
  imports: ["import react from '@vitejs/plugin-react';"],
  calls: [`react({ compiler: ${OUTSIDE_TESTS} })`],
};

export const PARTS: Record<HostedFramework, FrameworkParts> = {
  react: {
    framework: 'react',
    jsx: 'react-jsx',
    componentGlob: 'src/**/*.tsx',
    vitePlugin: REACT_VITE_PLUGIN,
    devDependencies: [
      '@eslint-react/eslint-plugin',
      'eslint-plugin-jsx-a11y-x',
      'eslint-plugin-react-hooks',
      '@vitejs/plugin-react',
      'oxc-transform-react',
      '@types/react',
      '@types/react-dom',
    ],
    dependencies: ['react', 'react-dom'],
    testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
    stateRules: ['react-state.md', 'hooks-order.md'],
  },
  vue: {
    framework: 'vue',
    sfcExtension: 'vue',
    componentGlob: 'src/**/*.vue',
    // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses unless named.
    allowBuilds: ['vue-demi'],
    vitePlugin: {
      imports: ["import vue from '@vitejs/plugin-vue';"],
      calls: ['vue()'],
    },
    dependencies: ['vue'],
    devDependencies: [
      'eslint-plugin-vue',
      'eslint-plugin-vuejs-accessibility',
      'vue-eslint-parser',
      '@vitejs/plugin-vue',
      'vue-tsc',
    ],
    testDevDependencies: ['@vue/test-utils'],
    stateRules: ['vue-reactivity.md'],
  },
  svelte: {
    framework: 'svelte',
    sfcExtension: 'svelte',
    componentGlob: 'src/**/*.svelte',
    // A host owns its own entry, and `sveltekit()` would take it over.
    vitePlugin: {
      imports: ["import { svelte } from '@sveltejs/vite-plugin-svelte';"],
      calls: ['svelte()'],
    },
    dependencies: ['svelte'],
    devDependencies: [
      'eslint-plugin-svelte',
      'svelte-eslint-parser',
      'svelte-check',
      '@sveltejs/vite-plugin-svelte',
    ],
    testDevDependencies: ['@testing-library/svelte'],
    testConditions: ['browser'],
    stateRules: ['svelte-reactivity.md'],
  },
  solid: {
    framework: 'solid',
    jsx: 'preserve',
    componentGlob: 'src/**/*.tsx',
    vitePlugin: {
      imports: ["import solid from 'vite-plugin-solid';"],
      calls: [`solid({ hot: ${OUTSIDE_TESTS} })`],
    },
    dependencies: ['solid-js'],
    jsxImportSource: 'solid-js',
    devDependencies: [
      'eslint-plugin-jsx-a11y-x',
      'eslint-plugin-solid',
      'vite-plugin-solid',
    ],
    testDevDependencies: ['@solidjs/testing-library'],
    testConditions: ['development', 'browser'],
    stateRules: ['solid-reactivity.md'],
  },
};

export const HOOKS_ALIAS: AliasMap = { '@hooks/*': './src/lib/hooks/*' };

// `react()` loads `jsx-a11y-x`, so every target composing that layer installs it.
export const COMMON_REACT_PLUGINS = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-jsx-a11y-x',
  'eslint-plugin-react-hooks',
];
