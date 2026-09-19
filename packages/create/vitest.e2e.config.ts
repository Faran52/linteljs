import { env } from 'node:process';

import { defineConfig } from 'vitest/config';

/**
 * The opt-in half of the split. `vitest.config.ts` excludes `*.e2e.test.ts` so the default gate
 * stays fast; this one includes nothing else, so `pnpm test:e2e` runs exactly the end-to-end
 * suite and never the unit tests alongside it.
 *
 * No `testTimeout` here: the suite sets its own per-case timeout, because the number that
 * matters is per target rather than per file.
 *
 * Sharding is `E2E_SHARD`/`E2E_SHARDS`, read in `matrix.ts`, not vitest's own `--shard`. Vitest
 * splits by file, and the nine files hold 11 to 91 cases each, so a file split cannot balance
 * them; the stride in `matrix.ts` gives every shard an even share of every target. `e2e.yml` runs
 * four, one machine each.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.e2e.test.ts'],
    // Starts the one registry holding the workspace versions; every case installs through it.
    globalSetup: ['src/pipeline/e2e/registry/registry.ts'],
    /**
     * Files run one at a time and the cases inside a file run together. Every case but the four in `managerCases`
     * is pnpm, and those four sit at the head of one file, so at most one bun, one yarn and one npm install is ever
     * in flight: the managers whose caches are least happy about a second writer are serialised by the shape of the
     * suite rather than by a lock.
     */
    fileParallelism: false,
    /**
     * Two, the same as `e2e.yml` gives a runner. Four was the earlier default and it starves the build leg: a case
     * is an install and a full `check`, the builds are almost entirely I/O, and `ng build` measured 65s alone
     * against over fifteen minutes with three siblings, each esbuild holding 1.4 to 1.7 GB. Raise it with
     * `E2E_CONCURRENCY` on a machine that can feed it.
     */
    maxConcurrency: Number(env['E2E_CONCURRENCY'] ?? '2'),
    hookTimeout: 120_000,
  },
});
