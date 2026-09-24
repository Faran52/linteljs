import { defineConfig } from 'vitest/config';

/**
 * Every test here runs a real ESLint: the typed ones start a TypeScript `projectService` and the SFC ones load
 * the Vue and Svelte parsers, so one case is seconds of real work. Under `--coverage`, with all four workspace
 * projects at once, the 5s default times out on a loaded machine or a shared CI runner rather than on a
 * defect (`eslint-plugin` raised it for the same reason).
 */
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
