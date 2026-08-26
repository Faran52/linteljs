import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  // ESM only. The entry point is a `bin` invoked by npx, never imported by a consumer's
  // bundler, so the CJS half of the dual build would ship unused.
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  sourcemap: false,
  target: 'node24',
});
