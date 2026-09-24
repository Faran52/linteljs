import { defineConfig } from 'tsdown';

export default defineConfig({
  /**
   * One entry per subpath in package.json `exports`. A subpath with no entry here typechecks fine and 404s at install
   * time, so `scripts/smoke/smokeScript.ts` resolves every one against the built `dist` before publish. Keyed, not an
   * array: an array preserves `src/frameworks/react/` in the output path, while `exports` points at a flat
   * `./dist/react.mjs`, so the source nests by subject and the output stays flat.
   */
  entry: {
    index: 'src/index.ts',
    base: 'src/layers/base/baseLayer.ts',
    defineConfig: 'src/defineConfig.ts',
    typescript: 'src/layers/typescript/typescriptLayer.ts',
    vitest: 'src/layers/vitest/vitestLayer.ts',
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
  },
  /**
   * ESM only. `@eslint-react/eslint-plugin`, and it will not be the last, publishes no `require` condition at
   * all, so a CJS half could not load its own peer dependencies. Flat config is ESM-first and every project
   * `@linteljs/create` generates is `"type": "module"`, so a CJS build would ship broken to serve nobody.
   */
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  // No sourcemaps, deliberately: tsdown drives declaration sourcemaps off the same flag, so with it on the
  // emitted `.d.mts` carries a `sourceMappingURL` for a file never written, a dead link in every editor.
  sourcemap: false,
  /**
   * The floor its own peer requires, not this workspace's: `peerDependencies.eslint` is `>=9` and ESLint 9 runs
   * on `^18.18.0`, so a Node 18 or 20 LTS consumer installing a node24 build gets EBADENGINE for a package
   * with no Node 24 API in it.
   */
  target: 'node18',
  deps: {
    // Never inline a peer: ESLint compares plugins by identity, and a bundled copy registers a second object.
    neverBundle: ['eslint'],
  },
});
