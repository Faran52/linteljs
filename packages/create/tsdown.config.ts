import { defineConfig } from 'tsdown';

export default defineConfig({
  // Keyed so the bin is named for its command; rolldown carries the source's hashbang into it.
  entry: {
    'index': 'src/index.ts',
    'create-linteljs': 'bin/createLinteljs.ts',
  },
  // ESM only: the entry is a `bin` npx runs, never imported, so a CJS half would ship unused.
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  platform: 'node',
  sourcemap: false,
  target: 'node22',
});
