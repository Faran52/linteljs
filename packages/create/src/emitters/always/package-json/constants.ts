import type { Router } from '@answers';
import type { Store } from '@answers/target/store/storeAnswer';
import type { Framework } from '@config/types';

// Caret ranges, so a project picks up patches. An entry this workspace also installs must be at least the
// `catalog:` version in `pnpm-workspace.yaml`; `versions.test.ts` gates it.

// Named, because `emitPnpmWorkspace` needs the major and a table lookup has an `undefined` arm no answer reaches.
export const ESLINT_RANGE = '^10.11.0';

export const VERSIONS: Record<string, string> = {
  // Angular's only route onto vitest.
  '@analogjs/vite-plugin-angular': '^2.7.2',
  '@astrojs/check': '^0.9.10',
  '@astrojs/react': '^6.0.6',
  '@astrojs/solid-js': '^7.0.2',
  '@astrojs/svelte': '^9.0.1',
  '@astrojs/vue': '^7.0.3',
  '@babel/core': '^8.0.6',
  'vite': '^8.3.0',
  '@commitlint/cli': '^21.2.2',
  '@commitlint/config-conventional': '^21.2.2',
  '@crxjs/vite-plugin': '^2.7.1',
  '@eslint-react/eslint-plugin': '^5.20.0',
  '@html-eslint/eslint-plugin': '^0.66.1',
  '@html-eslint/parser': '^0.66.1',
  // Both halves of NgRx 22, released together and peering `@angular/core ^22.0.0`, which is what `ng new` writes.
  '@ngrx/signals': '^22.0.1',
  '@ngrx/store': '^22.0.1',
  '@nanostores/react': '^2.0.1',
  '@nanostores/solid': '^1.1.1',
  '@nanostores/vue': '^1.1.0',
  'nanostores': '^1.5.3',
  '@reduxjs/toolkit': '^2.12.0',
  'react-redux': '^9.3.0',
  '@tanstack/angular-store': '^0.11.1',
  '@tanstack/react-store': '^0.11.1',
  '@tanstack/solid-store': '^0.11.1',
  '@tanstack/svelte-store': '^0.12.1',
  '@tanstack/vue-store': '^0.11.1',
  '@rolldown/plugin-babel': '^0.2.4',
  '@solidjs/testing-library': '^0.8.10',
  // What lets vitest load React Native at all.
  '@srsholmes/vitest-react-native': '^0.1.5',
  // The bare plugin, for a host that owns its entry; `sveltekit()` would take it over.
  '@sveltejs/vite-plugin-svelte': '^7.3.0',
  // The PostCSS half, for a target with no vite.config.ts; same release train as the plugin.
  '@tailwindcss/postcss': '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tanstack/angular-query-experimental': '^5.103.1',
  '@tanstack/eslint-plugin-query': '^5.103.1',
  '@tanstack/react-query': '^5.103.1',
  '@tanstack/solid-query': '^5.103.1',
  '@tanstack/svelte-query': '^6.2.1',
  '@tanstack/vue-query': '^5.103.1',
  // An unbundled peer of the React binding; inherited, pnpm leaves the first render() unresolved.
  '@testing-library/dom': '^10.4.2',
  '@testing-library/react': '^16.3.3',
  '@testing-library/react-native': '^14.0.1',
  '@testing-library/svelte': '^5.4.2',
  '@types/chrome': '^0.3.0',
  '@types/firefox-webext-browser': '^143.0.0',
  '@types/node': '^26.6.2',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.3.0',
  '@vitejs/plugin-react': '^6.1.1',
  '@vitest/coverage-v8': '^5.0.1',
  '@vitest/eslint-plugin': '^1.6.27',
  '@vue/test-utils': '^2.5.1',
  'angular-eslint': '^22.5.0',
  'astro': '^7.3.3',
  'astro-eslint-parser': '^3.1.0',
  'babel-plugin-react-compiler': '^1.0.0',
  'eslint': ESLINT_RANGE,
  // The plugin, not `eslint-config-next`, which bundles plugins the layers already cover; see `frameworks/next.ts`.
  '@next/eslint-plugin-next': '^16.3.5',
  // The sibling package; `versions.test.ts` fails the moment they diverge.
  '@linteljs/eslint-config': '^1.6.0',
  'eslint-plugin-react-hooks': '^7.1.1',
  'eslint-plugin-astro': '^3.2.1',
  'eslint-plugin-jsx-a11y-x': '^0.2.0',
  'eslint-plugin-better-tailwindcss': '^4.7.0',
  'eslint-plugin-solid': '^0.18.0',
  'eslint-plugin-svelte': '^3.23.0',
  '@vitejs/plugin-vue': '^6.0.9',
  'eslint-plugin-vue': '^10.11.0',
  'eslint-plugin-vuejs-accessibility': '^2.6.0',
  'happy-dom': '^20.14.5',
  'husky': '^9.1.7',
  'lint-staged': '^17.5.1',
  'postcss-html': '^2.0.0',
  // A vanilla or Astro scaffold installs no framework, so a hosted one brings its own.
  'react': '^19.3.0',
  'react-dom': '^19.3.0',
  'solid-js': '^1.9.15',
  // stylelint-config-standard@40 peers on ^17.
  'stylelint': '^17.15.0',
  'stylelint-config-recess-order': '^7.8.0',
  'stylelint-config-standard': '^40.0.0',
  'stylelint-config-tailwindcss': '^1.0.1',
  // A peer of stylelint-config-recess-order that pnpm does not install on its own.
  'stylelint-order': '^8.1.1',
  'svelte': '^5.57.1',
  'svelte-check': '^4.7.6',
  'svelte-eslint-parser': '^1.8.1',
  'tailwindcss': '^4.3.3',
  /**
   * Named rather than left to the peer resolver: `@testing-library/react-native` requires it, pnpm installs a
   * peer unasked and npm under `legacy-peer-deps` does not, and without it every `screen.getByTestId().props`
   * resolves to an error type that `skipLibCheck` hides from `tsc` and typescript-eslint reports.
   *
   * Tilde, like `typescript` below, and for the same kind of reason. 1.2.0 depends on `react-reconciler ~0.33.0`,
   * which peers `react ^19.2.0`; 1.3.0 moved to `~0.34.0`, which peers `react ^19.3.0`. Expo pins react 19.2.3, so
   * a caret floated every React Native project onto an unmet peer, which the end-to-end suite reads as install
   * noise and refuses. Raise this once an Expo SDK ships react 19.3.
   */
  'test-renderer': '~1.2.0',
  // Tilde: `typescript-eslint` peers `<6.1.0`, so a caret would admit a compiler the type-aware layer refuses.
  'typescript': '~6.0.3',
  'vite-plugin-solid': '^2.11.14',
  'vitest': '^5.0.1',
  'vue': '^3.5.43',
  'vue-eslint-parser': '^10.4.1',
  'vue-tsc': '^3.3.11',
  'zod': '^4.6.5',
  '@hookform/resolvers': '^5.9.1',
  '@t3-oss/env-core': '^0.13.11',
  '@t3-oss/env-nextjs': '^0.13.11',
  '@tanstack/angular-form': '^1.33.5',
  '@tanstack/eslint-plugin-router': '^1.162.0',
  '@tanstack/react-form': '^1.33.5',
  '@tanstack/react-router': '^1.170.38',
  '@tanstack/router-plugin': '^1.168.40',
  '@tanstack/solid-form': '^1.33.5',
  '@tanstack/svelte-form': '^1.33.5',
  '@tanstack/vue-form': '^1.33.5',
  'es-toolkit': '^1.52.0',
  'nativewind': '^5.0.0-rc.0',
  'postcss': '^8.5.28',
  'react-hook-form': '^7.88.0',
  // Exact, and a prerelease: `nativewind@5.0.0-rc.0` peers this one version, so a caret resolves past it.
  'react-native-css': '3.1.0-rc.0',
  'react-router': '^8.4.0',
  'ts-pattern': '^5.9.0',
  'zustand': '^5.0.15',
};

// Superseded by @linteljs/eslint-config.
export const SUPERSEDED = [
  'prettier',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-refresh',
  'oxlint',
  // create-vue's two: one is only called from the replaced vite.config.ts, jsdom is not the chosen environment.
  'vite-plugin-vue-devtools',
  'jsdom',
];

export const SHARED_DEV_DEPENDENCIES = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  // Declared: a scaffolder without its own copy fails tsc on "Cannot find type definition file for 'node'".
  '@types/node',
  'eslint',
  '@linteljs/eslint-config',
  'husky',
  'lint-staged',
  'stylelint',
  'stylelint-config-recess-order',
  'stylelint-config-standard',
  'stylelint-order',
];

// Omitting @vitest/eslint-plugin fails the first `eslint .`, not the install.
// `vite` is vitest's required peer; npm under `legacy-peer-deps` installs no peers, so it is named outright.
export const RUNNER_DEV_DEPENDENCIES = [
  '@vitest/coverage-v8',
  '@vitest/eslint-plugin',
  'happy-dom',
  'vite',
  'vitest',
];

export const HTML_DEV_DEPENDENCIES = ['@html-eslint/eslint-plugin', '@html-eslint/parser'];

// A host with no framework installs nothing at runtime.
export const TANSTACK_QUERY_BINDINGS: Record<Framework, string> = {
  'react': '@tanstack/react-query',
  'next': '@tanstack/react-query',
  'react-native': '@tanstack/react-query',
  'vue': '@tanstack/vue-query',
  'svelte': '@tanstack/svelte-query',
  'solid': '@tanstack/solid-query',
  'angular': '@tanstack/angular-query-experimental',
};

/**
 * What a chosen store installs, before any framework binding. Pinia is absent on purpose: `create-vue` installs it
 * from the `--pinia` flag, and a version pinned here would fight that. RTK Query ships inside the toolkit, so
 * `redux-toolkit` is the answer for both, with `react-redux` as what binds it to a component.
 */
export const STORE_DEPENDENCIES: Record<Store, readonly string[]> = {
  'zustand': ['zustand'],
  'redux-toolkit': ['@reduxjs/toolkit', 'react-redux'],
  'tanstack-store': [],
  'pinia': [],
  'ngrx-signals': ['@ngrx/signals'],
  'ngrx-store': ['@ngrx/store'],
  'nanostores': ['nanostores'],
};

/**
 * The package that binds a store to the framework rendering it, where one exists. Absent is an answer: Svelte reads
 * a nanostores atom through its own store contract, so there is no `@nanostores/svelte` to install, and a plain
 * Astro with no hosted framework uses the atoms directly. A store missing from this table binds nowhere.
 */
export const STORE_BINDINGS: Partial<Record<Store, Partial<Record<Framework, string>>>> = {
  'tanstack-store': {
    'react': '@tanstack/react-store',
    'next': '@tanstack/react-store',
    'react-native': '@tanstack/react-store',
    'vue': '@tanstack/vue-store',
    'svelte': '@tanstack/svelte-store',
    'solid': '@tanstack/solid-store',
    'angular': '@tanstack/angular-store',
  },
  'nanostores': {
    react: '@nanostores/react',
    vue: '@nanostores/vue',
    solid: '@nanostores/solid',
  },
};

export const TANSTACK_FORM_BINDINGS: Record<Framework, string> = {
  'react': '@tanstack/react-form',
  'next': '@tanstack/react-form',
  'react-native': '@tanstack/react-form',
  'vue': '@tanstack/vue-form',
  'svelte': '@tanstack/svelte-form',
  'solid': '@tanstack/solid-form',
  'angular': '@tanstack/angular-form',
};

export const ROUTER_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': ['react-router'],
  'tanstack-router': ['@tanstack/react-router'],
};

export const ROUTER_DEV_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': [],
  'tanstack-router': ['@tanstack/router-plugin', '@tanstack/eslint-plugin-router'],
};

/**
 * Install scripts every project approves; pnpm writes them to `pnpm-workspace.yaml`, bun reads `trustedDependencies`,
 * npm reads `allowScripts`. Yarn is absent because it runs install scripts by default and has nothing to approve.
 *
 * One list for all three, not a shared pair plus an npm-only pair. Measured with
 * `pnpm --filter @linteljs/create collect:builds`, which installs the maximal dependency set of all seventeen target
 * and hosted-framework combinations against pnpm and npm and reports what each would refuse to build:
 *
 * - `unrs-resolver` every target reaches, through `eslint-import-resolver-typescript`.
 * - `fsevents` npm 12 refuses on eleven of the seventeen, as an optional dependency of the watchers in each tree.
 *   npm 11 only warns, so it reports nothing and this entry looks dead on the version a project declares.
 * - `sharp` and `@swc/core` no combination reaches, on either manager, and both stay. Measured: an allowance for a
 *   package that is not installed is silent on pnpm and on npm 12, down to a name no registry has, so each costs a
 *   line. Without them, the day something pulls one, a user's first install stops; with them, the next
 *   `collect:builds` reports the change and nobody is interrupted. `create-next-app` writes
 *   `ignoredBuiltDependencies: - sharp` into its own scaffold, which is the ecosystem saying a Next tree meets it.
 *
 * Add a name because that script reported it, or because it is obviously of this kind. Removing one buys nothing.
 */
export const ALLOWED_BUILDS = ['@swc/core', 'fsevents', 'sharp', 'unrs-resolver'];
