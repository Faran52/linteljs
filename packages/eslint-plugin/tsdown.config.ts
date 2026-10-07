import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // `index.js`, not `.cjs`, so a deep import of `dist/index.js` keeps resolving.
  outExtensions: ({ format }) => {
    const extensions = format === 'cjs'
      ? {
          js: '.js',
          dts: '.d.ts',
        }
      : {
          js: '.mjs',
          dts: '.d.mts',
        };

    return extensions;
  },
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  // tsdown ties declaration sourcemaps to this flag, and they would point at a `.map` never written.
  sourcemap: false,
  // `engines.node` is `>=22.0.0`: a newer target keeps syntax Node 22 cannot parse.
  target: 'node22',
  deps: {
    neverBundle: ['eslint'],
  },
});
