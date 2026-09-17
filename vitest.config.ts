import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts', '**/e2e/helpers.ts', '**/e2e/registrySetup.ts', '**/cli.ts'],
      // A gate, not an aspiration: a number that has to come down is a regression, not a new
      // baseline. One key per package, on purpose. DESIGN.md: Coverage thresholds
      thresholds: {
        'packages/eslint-plugin/src/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'packages/eslint-config/src/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'packages/create/src/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
