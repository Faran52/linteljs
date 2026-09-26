import { defineConfig } from 'vitest/config';

// The `exclude` has to be here as well as in the root config: a vitest project does not inherit the root's
// `test.exclude`, so without it a plain `pnpm vitest run` collects the e2e files and runs real scaffolds and installs.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    /*
     * Vitest's default, written down because every run offers `isolate: false` and taking it breaks three files
     * silently: `nodeSpawn`, `packageManagerSpawn` and `prompts` each `vi.mock` a module, and a shared module registry
     * leaves the module under test bound to the real import, running real binaries in a unit suite.
     */
    isolate: true,
    // Real fs and spawned binaries per test; shared CI runners need margin the 5s default lacks.
    testTimeout: 30000,
    include: ['src/**/*.test.ts', 'templates/project/scripts/**/*.test.ts', 'templates/project/plugins/**/*.test.ts'],
    exclude: ['**/*.e2e.test.ts'],
  },
});
