import { defineConfig } from 'vitest/config';

/**
 * The opt-in half of the split. `vitest.config.ts` excludes `*.e2e.test.ts` so the default gate
 * stays fast; this one includes nothing else, so `pnpm test:e2e` runs exactly the end-to-end
 * suite and never the unit tests alongside it.
 *
 * No `testTimeout` here: the suite sets its own per-case timeout, because the number that
 * matters is per target rather than per file.
 *
 * Sharding: `--shard <index>/<count>` splits the files across runners; `e2e.yml` runs four. A shard
 * is its own process, so `registrySetup.ts` gives it its own registry port and its own `.e2e`
 * directory, which is what lets two run on one machine. Example:
 * `vitest run --config vitest.e2e.config.ts --shard 1/4`
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.e2e.test.ts'],
    // Starts a registry holding the workspace versions; every case installs through it.
    globalSetup: ['src/run/pipeline/e2e/registrySetup.ts'],
    // Within a shard, tests run sequentially: they each drive a real package manager install, and
    // running two at once thrashes the store, interleaves output and overloads the one registry.
    fileParallelism: false,
    hookTimeout: 120_000,
  },
});
