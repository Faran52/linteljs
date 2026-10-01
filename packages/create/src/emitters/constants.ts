import {
  type Framework,
  type Router,
  type Store,
} from '@config/types';

// Caret ranges; an entry this workspace also installs must be at least its `catalog:` version.

export const VERSIONS: Record<string, string> = {
  // Angular's only route onto vitest.
  '@analogjs/vite-plugin-angular': '^2.7.5',
  '@astrojs/check': '^0.9.10',
  '@astrojs/react': '^7.0.0',
  '@astrojs/solid-js': '^7.0.2',
  '@astrojs/svelte': '^9.0.1',
  '@astrojs/vue': '^7.0.3',
  'vite': '^8.3.1',
  '@commitlint/cli': '^21.2.3',
  '@commitlint/config-conventional': '^21.2.3',
  '@crxjs/vite-plugin': '^3.0.0',
  '@eslint-react/eslint-plugin': '^5.20.8',
  '@html-eslint/eslint-plugin': '^0.66.1',
  '@html-eslint/parser': '^0.66.1',
  // No `zone.js`: signals and `provideBrowserGlobalErrorListeners` are zoneless, Angular 20's default.
  '@angular/common': '^22.2.0',
  '@angular/compiler': '^22.2.0',
  '@angular/core': '^22.2.0',
  '@angular/forms': '^22.2.0',
  '@angular/platform-browser': '^22.2.0',
  '@angular/router': '^22.2.0',
  // Moves with `@analogjs/vite-plugin-angular`, which reads its internals.
  '@angular/build': '~22.2.0',
  '@angular/cli': '^22.2.0',
  '@angular/compiler-cli': '^22.2.0',
  'rxjs': '~7.8.2',
  'tslib': '^2.8.1',
  // Both halves of NgRx 22, released together and peering `@angular/core ^22.0.0`, which is what `ng new` writes.
  '@ngrx/signals': '^22.0.1',
  '@ngrx/store': '^22.0.1',
  '@nanostores/react': '^2.0.1',
  '@nanostores/solid': '^1.1.1',
  '@nanostores/vue': '^1.1.0',
  'nanostores': '^1.5.4',
  '@reduxjs/toolkit': '^2.12.0',
  'react-redux': '^9.3.0',
  '@tanstack/react-store': '^0.11.1',
  '@tanstack/solid-store': '^0.11.1',
  '@tanstack/svelte-store': '^0.12.1',
  '@tanstack/vue-store': '^0.11.1',
  // Stylelint's own major, named beside StyleX; `utils/packageJsonUtils.ts` says why.
  '@csstools/css-tokenizer': '^4.0.2',
  '@stylexjs/babel-plugin': '^0.19.1',
  '@stylexjs/postcss-plugin': '^0.19.1',
  '@stylexjs/stylex': '^0.19.1',
  '@stylexjs/unplugin': '^0.19.1',
  'unplugin': '^2.3.11',
  '@solidjs/testing-library': '^0.8.10',
  // What lets vitest load React Native at all.
  '@srsholmes/vitest-react-native': '^0.1.5',
  // The bare plugin, for a host that owns its entry; `sveltekit()` would take it over.
  '@sveltejs/vite-plugin-svelte': '^7.3.0',
  // The PostCSS half, for a target with no vite.config.ts.
  '@tailwindcss/postcss': '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tanstack/angular-query-experimental': '^5.103.2',
  '@tanstack/eslint-plugin-query': '^5.103.2',
  '@tanstack/react-query': '^5.103.2',
  '@tanstack/solid-query': '^5.103.2',
  '@tanstack/svelte-query': '^6.2.4',
  '@tanstack/vue-query': '^5.103.2',
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
  // Held to 0.145: that plugin and `@astrojs/react` both peer `^0.145.0`, which on a zero major admits 0.145 alone.
  'oxc-transform-react': '^0.145.0',
  '@vitest/coverage-v8': '^5.0.2',
  '@vitest/eslint-plugin': '^1.6.27',
  '@vue/test-utils': '^2.5.1',
  'angular-eslint': '^22.5.0',
  'astro': '^7.3.5',
  'astro-eslint-parser': '^3.2.0',
  'eslint': '^10.11.0',
  // Not `eslint-config-next`, which bundles plugins the layers already cover.
  '@next/eslint-plugin-next': '^16.3.6',
  // `utils/packageJsonUtils.test.ts` fails the moment the sibling package diverges.
  '@linteljs/eslint-config': '^2.0.0',
  'eslint-plugin-react-hooks': '^7.1.1',
  'eslint-plugin-astro': '^3.2.1',
  'eslint-plugin-jsx-a11y-x': '^0.2.0',
  'eslint-plugin-better-tailwindcss': '^4.7.0',
  '@stylexjs/eslint-plugin': '^0.19.1',
  'eslint-plugin-solid': '^0.18.0',
  'eslint-plugin-svelte': '^3.23.0',
  '@vitejs/plugin-vue': '^6.0.9',
  'eslint-plugin-vue': '^10.11.1',
  'eslint-plugin-vuejs-accessibility': '^2.6.0',
  'happy-dom': '^20.14.5',
  'husky': '^9.1.7',
  'lint-staged': '^17.5.1',
  'postcss-html': '^2.0.0',
  'next': '^16.3.6',
  'next-intl': '^4.14.8',
  // At exactly what the SDK's own template pins, which `expo-doctor` checks. docs/DESIGN.md has why.
  'expo': '~57.0.25',
  'react-native': '0.86.3',
  // react-native's cli plugin peers its own release exactly and worklets peers `*`; declared, both resolve to it.
  '@react-native/metro-config': '0.86.3',
  'expo-router': '~57.0.23',
  'expo-constants': '~57.0.19',
  'expo-linking': '~57.0.11',
  'expo-status-bar': '~57.0.1',
  'react-native-safe-area-context': '~5.7.0',
  'react-native-screens': '~4.26.0',
  'react-native-gesture-handler': '~2.32.0',
  'react-native-reanimated': '4.5.1',
  'react-native-worklets': '0.10.1',
  'react-native-web': '~0.21.0',
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
  // Its own template installs the kit and the adapter rather than inheriting them from `sv create`.
  '@sveltejs/kit': '^2.70.3',
  '@sveltejs/adapter-auto': '^7.0.1',
  'svelte-check': '^4.7.6',
  'svelte-eslint-parser': '^1.8.1',
  'tailwindcss': '^4.3.3',
  // Named: npm under `legacy-peer-deps` skips this peer, and `screen.getByTestId().props` becomes an error type.
  // Tilde: 1.3.0 peers `react ^19.3.0` and Expo pins 19.2.3. Raise once an Expo SDK ships react 19.3.
  'test-renderer': '~1.2.0',
  // Tilde: `typescript-eslint` peers `<6.1.0`, so a caret would admit a compiler the type-aware layer refuses.
  'typescript': '~6.0.3',
  // Answers requests, never ships in a build.
  'msw': '^2.15.0',
  // `URLSearchParams` loses an array; this keeps it.
  'qs': '^6.16.0',
  '@types/qs': '^6.15.1',
  'vite-plugin-solid': '^2.11.14',
  'vitest': '^5.0.2',
  'vue': '^3.5.43',
  'nuxt': '^4.5.2',
  // nuxt 4.5's own peer range.
  'rolldown': '~1.2.11',
  // A Vue application routes, and this target asks no router question.
  'vue-router': '^5.3.1',
  'pinia': '^4.0.3',
  '@vue/devtools-api': '^8.2.1',
  'vue-eslint-parser': '^10.4.1',
  'vue-tsc': '^3.3.11',
  'zod': '^4.6.5',
  '@hookform/resolvers': '^5.9.1',
  '@t3-oss/env-core': '^0.13.11',
  '@t3-oss/env-nextjs': '^0.13.11',
  '@tanstack/angular-form': '^1.33.5',
  '@tanstack/eslint-plugin-router': '^1.162.0',
  '@tanstack/react-form': '^1.33.5',
  '@tanstack/react-router': '^1.170.39',
  '@tanstack/solid-form': '^1.33.5',
  '@tanstack/svelte-form': '^1.33.5',
  '@tanstack/vue-form': '^1.33.5',
  'es-toolkit': '^1.52.0',
  'nativewind': '^5.0.0-rc.0',
  'postcss': '^8.5.28',
  'react-hook-form': '^7.88.0',
  'i18next': '^26.4.2',
  'i18next-browser-languagedetector': '^8.2.1',
  'react-i18next': '^17.0.15',
  // Exact, and a prerelease: `nativewind@5.0.0-rc.0` peers this one version.
  'react-native-css': '3.1.0-rc.0',
  // NativeWind 5's documented pin: react-native-css fails to deserialize global.css under 1.32 and 1.33.
  'lightningcss': '1.30.1',
  'react-router': '^8.4.0',
  // Pinned with the router: React Router releases them as one version.
  '@react-router/dev': '^8.4.0',
  '@react-router/node': '^8.4.0',
  '@react-router/serve': '^8.4.0',
  'isbot': '^5.2.2',
  'ts-pattern': '^5.9.0',
  'zustand': '^5.0.15',
};

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

// `vite` is vitest's required peer; npm under `legacy-peer-deps` installs no peers.
export const RUNNER_DEV_DEPENDENCIES = [
  '@vitest/coverage-v8',
  '@vitest/eslint-plugin',
  'happy-dom',
  'vite',
  'vitest',
];

export const HTML_DEV_DEPENDENCIES = ['@html-eslint/eslint-plugin', '@html-eslint/parser'];

export const TANSTACK_QUERY_BINDINGS: Record<Framework, string> = {
  'react': '@tanstack/react-query',
  'next': '@tanstack/react-query',
  'react-native': '@tanstack/react-query',
  'vue': '@tanstack/vue-query',
  'nuxt': '@tanstack/vue-query',
  'svelte': '@tanstack/svelte-query',
  'solid': '@tanstack/solid-query',
  'angular': '@tanstack/angular-query-experimental',
};

// TanStack Store's binding re-exports the core; RTK Query ships inside the toolkit.
export const STORE_DEPENDENCIES: Record<Store, readonly string[]> = {
  'zustand': ['zustand'],
  'redux-toolkit': ['@reduxjs/toolkit', 'react-redux'],
  'tanstack-store': [],
  // pinia 4 made its devtools a required peer, which only pnpm and bun install unasked.
  'pinia': ['pinia', '@vue/devtools-api'],
  'ngrx-signals': ['@ngrx/signals'],
  'ngrx-store': ['@ngrx/store'],
  'nanostores': ['nanostores'],
};

// Svelte reads a nanostores atom through its own store contract, so there is no `@nanostores/svelte`.
export const STORE_BINDINGS: Partial<Record<Store, Partial<Record<Framework, string>>>> = {
  'tanstack-store': {
    'react': '@tanstack/react-store',
    'next': '@tanstack/react-store',
    'react-native': '@tanstack/react-store',
    'vue': '@tanstack/vue-store',
    'svelte': '@tanstack/svelte-store',
    'solid': '@tanstack/solid-store',
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
  'nuxt': '@tanstack/vue-form',
  'svelte': '@tanstack/svelte-form',
  'solid': '@tanstack/solid-form',
  'angular': '@tanstack/angular-form',
};

export const ROUTER_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': ['react-router'],
  'react-router-framework': [],
  'tanstack-router': ['@tanstack/react-router'],
};

export const ROUTER_DEV_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': [],
  'react-router-framework': [],
  'tanstack-router': ['@tanstack/eslint-plugin-router'],
};

// Measured with `collect:builds`; Yarn runs install scripts by default and has nothing to approve.
// `sharp` and `@swc/core` stay: an allowance for an absent package is silent, and removing one buys nothing.
export const ALLOWED_BUILDS = [
  '@swc/core',
  'fsevents',
  'sharp',
  'unrs-resolver',
];
