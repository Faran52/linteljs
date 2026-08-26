import { defineConfig } from 'tsdown';

export default defineConfig({
  /**
   * One entry per subpath in package.json `exports`. A subpath with no entry here typechecks fine and 404s at
   * install time, so `scripts/smoke.js` resolves every one against the built `dist` before publish. Keyed, not
   * an array: an array preserves `src/frameworks/` in the output path, while `exports` points at a flat
   * `./dist/react.mjs`.
   */
  entry: {
    index: 'src/index.ts',
    base: 'src/base.ts',
    defineConfig: 'src/defineConfig.ts',
    typescript: 'src/typescript.ts',
    vitest: 'src/vitest.ts',
    html: 'src/html.ts',
    astro: 'src/astro.ts',
    react: 'src/frameworks/react.ts',
    next: 'src/frameworks/next.ts',
    vue: 'src/frameworks/vue.ts',
    svelte: 'src/frameworks/svelte.ts',
    solid: 'src/frameworks/solid.ts',
    angular: 'src/frameworks/angular.ts',
    tanstackQuery: 'src/libraries/tanstackQuery.ts',
    tailwind: 'src/libraries/tailwind.ts',
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
