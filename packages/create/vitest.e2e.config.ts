import { env } from 'node:process';

import { defineConfig } from 'vitest/config';

// Split by `E2E_PM` rather than `--shard`: vitest splits by file, and one file holds every target.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.e2e.test.ts'],
    globalSetup: ['src/pipeline/e2e/registry/registry.ts'],
    // `createProject` holds one install per binary at a time, so no manager's cache meets a second writer.
    fileParallelism: false,
    // `ng build` measured 65s alone against over fifteen minutes with three siblings.
    maxConcurrency: Number(env['E2E_CONCURRENCY'] ?? '2'),
    hookTimeout: 120_000,
    // Truncated at 40 characters, two cases share a title and `-t` cannot name one.
    taskTitleValueFormatTruncate: 1000,
  },
});
