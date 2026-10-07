import { defineConfig } from 'tsdown';

export default defineConfig({
  // Keyed, not an array: an array keeps `src/frameworks/react/` in the output path, and `exports` is flat.
  entry: {
    index: 'src/index.ts',
    base: 'src/layers/base/baseLayer.ts',
    composeConfig: 'src/compose-config/composeConfig.ts',
    typescript: 'src/layers/typescript/typescriptLayer.ts',
    vitest: 'src/layers/vitest/vitestLayer.ts',
    jest: 'src/layers/jest/jestLayer.ts',
    html: 'src/layers/html/htmlLayer.ts',
    astro: 'src/frameworks/astro/astroFramework.ts',
    react: 'src/frameworks/react/reactFramework.ts',
    reactNative: 'src/frameworks/react-native/reactNativeFramework.ts',
    next: 'src/frameworks/next/nextFramework.ts',
    vue: 'src/frameworks/vue/vueFramework.ts',
    nuxt: 'src/frameworks/nuxt/nuxtFramework.ts',
    svelte: 'src/frameworks/svelte/svelteFramework.ts',
    solid: 'src/frameworks/solid/solidFramework.ts',
    angular: 'src/frameworks/angular/angularFramework.ts',
    tanstackQuery: 'src/libraries/tanstack-query/tanstackQueryLibrary.ts',
    tanstackRouter: 'src/libraries/tanstack-router/tanstackRouterLibrary.ts',
    tailwind: 'src/libraries/tailwind/tailwindLibrary.ts',
    stylex: 'src/libraries/stylex/stylexLibrary.ts',
  },
  // ESM only: `@eslint-react/eslint-plugin` publishes no `require` condition, so a CJS half could not load it.
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  // tsdown ties declaration sourcemaps to this flag, and they would point at a file never written.
  sourcemap: false,
  // The `engines.node` floor.
  target: 'node22',
  deps: {
    // Never inline a peer: ESLint compares plugins by identity, and a bundled copy registers a second object.
    neverBundle: ['eslint'],
  },
});
