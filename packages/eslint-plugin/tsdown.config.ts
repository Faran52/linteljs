import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  /**
   * The CJS half is `index.js`, not `index.cjs`; `dist/package.json` marks the directory `commonjs` so Node still
   * reads it correctly under this package's `"type": "module"`. Measured, not stylistic: ESLint 5's config loader
   * switches on the file extension and knows `.js`, `.json`, `.yaml` and `.yml`, so a `.cjs` main falls to its
   * YAML branch and `plugin:@linteljs/recommended` reads the bundle as YAML and dies on line 2.
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
   * No sourcemaps, deliberately: tsdown drives the declaration sourcemap off the same flag, so with it on the emitted
   * `.d.mts`/`.d.cts` carry a `sourceMappingURL` for a `.map` never written. The JS maps were 224 kB against 60 kB of
   * source. `scripts/release/smoke/smokeRelease.ts` fails the build on a reference to a map the package lacks.
   */
  sourcemap: false,
  // The published floor, not this workspace's: `engines.node` is `>=14.0.0`, and a bundle emitted for
  // node24 keeps syntax node14 cannot parse, failing on `require` before any rule ran.
  target: 'node14',
  deps: {
    // `eslint` is a peer dependency and must never be inlined into the bundle.
    neverBundle: ['eslint'],
  },
});
