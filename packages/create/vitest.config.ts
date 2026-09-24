import { defineConfig } from 'vitest/config';

/**
 * The `exclude` is the load-bearing line, and it has to be here rather than only in the root config.
 * `projects: ['packages/*']` makes each package its own vitest project, and a project does not inherit the root's
 * `test.exclude`, so with only the root entry the e2e test files under `run/pipeline/e2e/` are collected by a plain
 * `pnpm vitest run` and, once the tarballs they look for exist, run real scaffolds and installs inside a fast gate.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    /*
     * Vitest's default, written down because every run prints "at least ~1.61s faster with isolate: false" and
     * taking that offer breaks three files silently. `nodeSpawn`, `packageManagerSpawn` and `prompts` each mock a
     * module with `vi.mock`, and one module registry shared across files leaves the module under test bound to the
     * real import: measured under `--no-isolate --no-file-parallelism`, `nodeSpawn()` answered this machine's
     * 26.9.0 where the mock said it should answer nothing, and `packageManagerSpawn('pnpm')` answered the real
     * 12.4.1. Green either way without this line, and running real binaries in a unit suite.
     */
    isolate: true,
    // Real fs and spawned binaries per test; shared CI runners need margin the 5s default lacks.
    testTimeout: 30000,
    include: ['src/**/*.test.ts', 'templates/project/scripts/**/*.test.ts'],
    exclude: ['**/*.e2e.test.ts'],
  },
});
