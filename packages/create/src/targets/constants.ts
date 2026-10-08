import {
  type AliasMap,
  type HostedFramework,
  type NamingMap,
} from '@config/types';

import { hasI18n } from './utils/gateUtils';

import type {
  FrameworkParts,
  PluginSpec,
  StarterFile,
  StarterTest,
} from './types';

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

// docs/DESIGN.md says why `oxc-transform-react` rather than Babel.
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

// create-vite's `template-*/_gitignore`.
export const VITE_GITIGNORE = [
  'dist',
  'dist-ssr',
  '*.local',
];

export const HOOKS_ALIAS: AliasMap = { '@hooks/*': './src/lib/hooks/*' };

// `react()` loads `jsx-a11y-x`, so every target composing that layer installs it.
export const COMMON_REACT_PLUGINS = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-jsx-a11y-x',
  'eslint-plugin-react-hooks',
];

// The config files every starter translates, each from the one shared asset.
export const TRANSLATED_CONFIGS = ['src/config/statuses.ts', 'src/config/standard.ts'];

// A locale key's `Msw` twin sits on the line after it, holding what the key says once MSW answers the form.
export const MSW_TWIN = /^ {2}"\w+Msw": .*\n/gmv;

export const TWINNED_KEY = / {2}"(?<key>\w+)": .*\n {2}"\k<key>Msw": /gv;

// The forms whose contact page reads a `useContactForm` hook of their own.
export const CONTACT_HOOK_FORMS = ['tanstack-form', 'react-hook-form'] as const;

// The stores whose counter is a module of its own.
export const COUNTER_MODULE_STORES = ['zustand', 'tanstack-store'] as const;

// The suite of the shared `ForbiddenError`, on every target whose boundary maps it to the 403 page.
export const STATUS_UTILS_TEST: StarterTest = {
  target: 'src/lib/utils/statusUtils.test.ts',
  covers: 'src/lib/utils/statusUtils.ts',
  shared: true,
};

// Where a web target's language choice is stored, read by its server too where it has one.
export const COOKIE_UTILS: StarterFile = {
  target: 'src/i18n/utils/cookieUtils.ts',
  when: hasI18n,
  variant: 'i18n',
  shared: true,
};

export const COOKIE_UTILS_TEST: StarterTest = {
  target: 'src/i18n/utils/cookieUtils.test.ts',
  covers: COOKIE_UTILS.target,
  when: hasI18n,
  variant: 'i18n',
  shared: true,
};

// The shared TanStack Query option builders every adapter reads, with no extension.
export const OPTIONS_UTILS = 'src/lib/utils/queryOptionsUtils';

// Not awaited: nothing posts before a person sends the form, and no entry needs a top-level await.
export const WORKER_START = `import('@mocks/msw/browser')
    .then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
    })
    .catch((err: unknown) => {
      console.error(err);
    });`;

// SSR too: React Router's `root.tsx` also renders on the server, which has no service worker.
export const VITE_WORKER_START = `if (import.meta.env.DEV && !import.meta.env.SSR) {
  ${WORKER_START}
}`;
