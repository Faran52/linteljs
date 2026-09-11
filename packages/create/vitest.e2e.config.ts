import { defineConfig } from 'vitest/config';

/**
 * The opt-in half of the split. `vitest.config.ts` excludes `*.e2e.test.ts` so the default gate
 * stays fast; this one includes nothing else, so `pnpm test:e2e` runs exactly the end-to-end
 * suite and never the unit tests alongside it.
 *
 * No `testTimeout` here: the suite sets its own per-case timeout, because the number that
 * matters is per target rather than per file.
 *
 * Sharding: Use `--shard <index>/<count>` to parallelize across CI runners. Each shard runs
 * a subset of the test files. Example: `vitest run --config vitest.e2e.config.ts --shard 1/4`
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.e2e.test.ts'],
    // Shards run in separate processes, each with its own store access. Within a shard,
    // tests run sequentially to avoid thrashing the pnpm store and interleaving output.
    fileParallelism: false,
    hookTimeout: 120_000,
  },
});
