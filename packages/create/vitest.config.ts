import { defineConfig } from 'vitest/config';

// A vitest project does not inherit the root's `test.exclude`; without this the e2e files run.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    // Vitest's default, pinned: `isolate: false` leaves three `vi.mock` suites running real binaries.
    isolate: true,
    // Real fs and spawned binaries per test; shared CI runners need more than the 5s default.
    testTimeout: 30000,
    include: [
      'src/**/*.test.ts',
      'templates/project/scripts/**/*.test.ts',
      'templates/project/plugins/**/*.test.ts',
    ],
    exclude: ['**/*.e2e.test.ts'],
  },
});
