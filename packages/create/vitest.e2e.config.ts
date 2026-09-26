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
 * The split is `E2E_PM`, one package manager per run, read in `targets.e2e.test.ts`, not vitest's
 * own `--shard`: vitest splits by file, and one file holds every target. `e2e.yml` runs one job per
 * manager, one machine each.
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
     * Files run one at a time and the cases inside a file run together. `createProject` holds one install per
     * binary at a time, pnpm excepted, so the managers whose caches are least happy about a second writer never
     * meet one.
     */
    fileParallelism: false,
    /**
     * Two, the same as `e2e.yml` gives a runner: a case is an install and a full `check`, and `ng build` measured 65s
     * alone against over fifteen minutes with three siblings. Raise it with `E2E_CONCURRENCY` on a machine that can
     * feed it.
     */
    maxConcurrency: Number(env['E2E_CONCURRENCY'] ?? '2'),
    hookTimeout: 120_000,
    // A case's title is its label, which runs past vitest's 40-character cut: truncated, two cases share a title and
    // `-t` cannot name one.
    taskTitleValueFormatTruncate: 1000,
  },
});
