import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // `index.js`, not `.cjs`: ESLint 5's config loader sends `.cjs` to its YAML branch and dies on line 2.
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
  // tsdown ties declaration sourcemaps to this flag, and they would point at a `.map` never written.
  sourcemap: false,
  // `engines.node` is `>=14.0.0`: a node24 bundle keeps syntax node14 cannot parse.
  target: 'node14',
  deps: {
    neverBundle: ['eslint'],
  },
});
