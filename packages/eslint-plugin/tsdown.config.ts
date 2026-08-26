import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  /**
   * The CJS half is `index.js`, not `index.cjs`; `dist/package.json` marks the directory `commonjs` so Node still
   * reads it correctly under this package's `"type": "module"`. Measured, not stylistic: ESLint 5's config loader
   * switches on the file extension and knows `.js`, `.json`, `.yaml` and `.yml`, so a `.cjs` main falls to its
   * YAML branch and `plugin:@linteljs/recommended` reads the bundle as YAML and dies on line 2. Published 1.0.3 has
   * this defect, which is why its `eslint >=5.0.0` never actually worked on 5.
   */
  outExtensions: ({ format }) => {
    return format === 'cjs'
      ? {
          js: '.js',
          dts: '.d.ts',
        }
      : {
          js: '.mjs',
          dts: '.d.mts',
        };
  },
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  /**
   * No sourcemaps, deliberately: tsdown drives the declaration sourcemap off the same flag, so with it on the
   * emitted `.d.mts`/`.d.cts` carry a `sourceMappingURL` for a `.map` never written, a dead link in every editor.
   * The JS maps were also 224 kB against 60 kB of source, and a rule crash is reproduced against `src` and the
   * suite rather than by stepping through the bundle. `scripts/smoke.js` fails the build if any shipped file
   * references a map that is not in the package.
   */
  sourcemap: false,
  /**
   * The published floor, not this workspace's: `engines.node` is `>=12.0.0`, and a bundle
   * emitted for node24 keeps optional chaining and nullish coalescing that node12 cannot parse,
   * failing on `require` before any rule ran. `scripts/smoke.js` greps the built artifact for both.
   */
  target: 'node12',
  deps: {
    // `eslint` is a peer dependency and must never be inlined into the bundle.
    neverBundle: ['eslint'],
  },
});
