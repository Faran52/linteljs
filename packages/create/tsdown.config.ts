import { defineConfig } from 'tsdown';

export default defineConfig({
  // Keyed so the bin is named for its command; rolldown carries the source's hashbang into it.
  entry: {
    'index': 'src/index.ts',
    'create-linteljs': 'bin/createLinteljs.ts',
  },
  // ESM only. The entry point is a `bin` invoked by npx, never imported by a consumer's
  // bundler, so the CJS half of the dual build would ship unused.
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  sourcemap: false,
  target: 'node22',
});
