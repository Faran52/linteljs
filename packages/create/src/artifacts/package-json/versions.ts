import type { PackageManager } from '../../model/answers/answers';

// Caret ranges, so a project picks up patches. An entry this workspace also installs must be at least the
// `catalog:` version in `pnpm-workspace.yaml`; `versions.test.ts` gates it.

// Named, because `emitPnpmWorkspace` needs the major and a table lookup has an `undefined` arm no answer reaches.
export const ESLINT_RANGE = '^10.10.0';

export const VERSIONS: Record<string, string> = {
  // Angular's only route onto vitest.
  '@analogjs/vite-plugin-angular': '^2.7.0',
  '@astrojs/check': '^0.9.10',
  '@astrojs/react': '^6.0.2',
  '@astrojs/solid-js': '^7.0.2',
  '@astrojs/svelte': '^9.0.1',
  '@astrojs/vue': '^7.0.2',
  '@babel/core': '^8.0.1',
  'vite': '^8.2.2',
  '@commitlint/cli': '^21.2.2',
  '@commitlint/config-conventional': '^21.2.2',
  '@crxjs/vite-plugin': '^2.7.1',
  '@eslint-react/eslint-plugin': '^5.19.0',
  '@html-eslint/eslint-plugin': '^0.65.0',
  '@html-eslint/parser': '^0.65.0',
  // NgRx stable peers on Angular 21 while `ng new` writes 22; the rc's caret self-heals. Measurements in DESIGN.md.
  '@ngrx/signals': '^22.0.0-rc.0',
  '@rolldown/plugin-babel': '^0.2.4',
  '@solidjs/testing-library': '^0.8.10',
  // What lets vitest load React Native at all.
  '@srsholmes/vitest-react-native': '^0.1.5',
  // The bare plugin, for a host that owns its entry; `sveltekit()` would take it over.
  '@sveltejs/vite-plugin-svelte': '^7.3.0',
  // The PostCSS half, for a target with no vite.config.ts; same release train as the plugin.
  '@tailwindcss/postcss': '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tanstack/angular-query-experimental': '^5.101.4',
  '@tanstack/eslint-plugin-query': '^5.102.8',
  '@tanstack/react-query': '^5.101.4',
  '@tanstack/solid-query': '^5.101.4',
  '@tanstack/svelte-query': '^6.1.38',
  '@tanstack/vue-query': '^5.101.4',
  // An unbundled peer of the React binding; inherited, pnpm leaves the first render() unresolved.
  '@testing-library/dom': '^10.4.1',
  '@testing-library/react': '^16.3.2',
  '@testing-library/react-native': '^14.0.1',
  '@testing-library/svelte': '^5.4.2',
  '@types/chrome': '^0.2.5',
  '@types/firefox-webext-browser': '^143.0.0',
  '@types/node': '^26.5.1',
  '@types/react': '^19.2.18',
  '@types/react-dom': '^19.2.4',
  '@vitejs/plugin-react': '^6.0.5',
  '@vitest/coverage-v8': '^5.0.0',
  '@vitest/eslint-plugin': '^1.6.27',
  '@vue/test-utils': '^2.4.11',
  'angular-eslint': '^22.5.0',
  'astro': '^7.2.1',
  'astro-eslint-parser': '^3.1.0',
  'babel-plugin-react-compiler': '^1.0.0',
  'eslint': ESLINT_RANGE,
  // The plugin, not `eslint-config-next`, which bundles plugins the layers already cover; see `frameworks/next.ts`.
  '@next/eslint-plugin-next': '^16.3.5',
  // The sibling package; `versions.test.ts` fails the moment they diverge.
  '@linteljs/eslint-config': '^1.6.0',
  'eslint-plugin-react-hooks': '^7.1.1',
  'eslint-plugin-astro': '^3.1.0',
  'eslint-plugin-jsx-a11y-x': '^0.2.0',
  'eslint-plugin-better-tailwindcss': '^4.7.0',
  'eslint-plugin-solid': '^0.18.0',
  'eslint-plugin-svelte': '^3.23.0',
  '@vitejs/plugin-vue': '^6.0.8',
  'eslint-plugin-vue': '^10.11.0',
  'eslint-plugin-vuejs-accessibility': '^2.6.0',
  'happy-dom': '^20.11.2',
  'husky': '^9.1.7',
  'lint-staged': '^17.3.0',
  'postcss-html': '^2.0.0',
  // A vanilla or Astro scaffold installs no framework, so a hosted one brings its own.
  'react': '^19.2.8',
  'react-dom': '^19.2.8',
  'solid-js': '^1.9.14',
  // stylelint-config-standard@40 peers on ^17.
  'stylelint': '^17.14.1',
  'stylelint-config-recess-order': '^7.8.0',
  'stylelint-config-standard': '^40.0.0',
  'stylelint-config-tailwindcss': '^1.0.1',
  // A peer of stylelint-config-recess-order that pnpm does not install on its own.
  'stylelint-order': '^8.1.1',
  'svelte': '^5.57.0',
  'svelte-check': '^4.7.5',
  'svelte-eslint-parser': '^1.8.1',
  'tailwindcss': '^4.3.3',
  /**
   * Named rather than left to the peer resolver: `@testing-library/react-native` requires it, pnpm installs a
   * peer unasked and npm under `legacy-peer-deps` does not, and without it every `screen.getByTestId().props`
   * resolves to an error type that `skipLibCheck` hides from `tsc` and typescript-eslint reports.
   */
  'test-renderer': '^1.2.0',
  // Tilde: `typescript-eslint` peers `<6.1.0`, so a caret would admit a compiler the type-aware layer refuses.
  'typescript': '~6.0.3',
  'vite-plugin-solid': '^2.11.14',
  'vitest': '^5.0.0',
  'vue': '^3.5.42',
  'vue-eslint-parser': '^10.4.1',
  'vue-tsc': '^3.3.9',
  'zod': '^4.4.3',
  '@hookform/resolvers': '^5.9.1',
  '@t3-oss/env-core': '^0.13.11',
  '@t3-oss/env-nextjs': '^0.13.11',
  '@tanstack/angular-form': '^1.33.5',
  '@tanstack/eslint-plugin-router': '^1.162.0',
  '@tanstack/react-form': '^1.33.5',
  '@tanstack/react-router': '^1.170.36',
  '@tanstack/router-plugin': '^1.168.38',
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
  'zustand': '^5.0.14',
};

// An exact version: corepack rejects a range in `packageManager`.
export const PACKAGE_MANAGER_VERSIONS: Record<PackageManager, string> = {
  pnpm: '12.4.1',
  // 11, not 12: `create-expo-app` cannot read npm 12's `npm pack --dry-run --json`, so React Native needs npm 11
  // on PATH, and a project declaring a 12 floor then warns EBADENGINE on every install. expo/expo#48091.
  npm: '11.19.1',
  yarn: '4.18.0',
  bun: '1.3.14',
};

export const NODE_ENGINE = '>=26.8.2';
