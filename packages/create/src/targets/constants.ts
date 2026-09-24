import type { HostedFramework } from '#answers/target/hosted-framework/hostedFrameworkAnswer';
import type { AliasMap, NamingMap } from '#config/types';
import type { FrameworkParts, PluginSpec } from './types';

// The glob vocabulary `check-file` is given, and the three shapes the naming tables on the records compose out
// of it.
const KEBAB = '+([a-z0-9])*(-+([a-z0-9]))';

// Everything except camelCase, so `[slug]`, `(tabs)`, `_layout` and `+page@(app)` pass while `useThing` does not.
export const COMPONENT = '!([a-z]*[A-Z]*)';

// Kebab-case or camelCase, so `vite-env.d.ts` and `assets.d.ts` both pass.
export const DECLARATION = `@(${KEBAB}|+([a-z])*([a-zA-Z0-9]))`;

// Plus `__tests__`, which every framework's tooling reserves.
export const FOLDER = `@(${KEBAB}|__tests__)`;

// Plus the segments a file-based router owns, granted to the React family, Solid and SvelteKit.
export const FOLDER_ROUTED = String.raw`@(${KEBAB}|__tests__|\[*\]|\(*\)|{*})`;

// Its own key: `src/**/*.ts` matches `vite-env.d.ts`, and two keys on one file must agree.
export const DECLARATION_KEY: NamingMap = { 'src/**/*.d.ts': DECLARATION };

// Off for the test run: the React Compiler's memo cache and `vite-plugin-solid`'s HMR handler each leave one
// uncovered branch per component. `process.env.VITEST`, not `mode`, because a function config cannot be merged.
export const OUTSIDE_TESTS = 'process.env.VITEST === undefined';

// Stands `useNavigate` in for a suite that mounts no router; every React binding and Solid's take the same one.
export const ROUTER_MOCK = 'fragments/test-setup/setupTests.router.ts';

// The one spelling of React's build wiring, read by the React target and every host.
export const REACT_VITE_PLUGIN: PluginSpec = {
  imports: [
    "import react, { reactCompilerPreset } from '@vitejs/plugin-react';",
    "import babel from '@rolldown/plugin-babel';",
  ],
  calls: [
    `...(${OUTSIDE_TESTS}\n`
    + '      ? [babel({ presets: [reactCompilerPreset()] }), react()]\n'
    + '      : [react()])',
  ],
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
      '@rolldown/plugin-babel',
      '@babel/core',
      'babel-plugin-react-compiler',
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
    // `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses unless it is named.
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
    // The bare plugin: a host owns its own entry, and `sveltekit()` would take it over.
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
    devDependencies: ['eslint-plugin-jsx-a11y-x', 'eslint-plugin-solid', 'vite-plugin-solid'],
    testDevDependencies: ['@solidjs/testing-library'],
    testConditions: ['development', 'browser'],
    stateRules: ['solid-reactivity.md'],
  },
};

export const HOOKS_ALIAS: AliasMap = { '@hooks/*': './src/lib/hooks/*' };

// `jsx-a11y-x` is here because `react()` loads it, so every target composing that layer installs it.
export const COMMON_REACT_PLUGINS = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-jsx-a11y-x',
  'eslint-plugin-react-hooks',
];
