import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // `index.js`, not `.cjs`: ESLint's config loader before 6.8 sends `.cjs` to its YAML branch and dies on line 2.
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
  // `engines.node` is `>=18.0.0`: a node24 bundle keeps syntax node18 cannot parse.
  target: 'node18',
  deps: {
    neverBundle: ['eslint'],
  },
});
