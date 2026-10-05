import { defineConfig } from 'vitest/config';

// Every case runs a real ESLint; under `--coverage` the 5s default times out on a loaded machine.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    testTimeout: 60000,
  },
});
