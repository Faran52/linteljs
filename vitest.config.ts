import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.e2e.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'packages/*/src/**/*.ts',
        'packages/eslint-plugin/scripts/audit/real-code/utils/{attribution,finding,fix,fixPass,optionSweep}Utils.ts',
      ],
      // The e2e harness spawns and publishes, so it runs only under `test:e2e`; `e2e/matrix/` is pure and stays.
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
        '**/e2e/*.ts',
        '**/e2e/browser/**',
        '**/e2e/registry/**',
        '**/e2e/runner/**',
        '**/e2e/targets/**',
        '**/e2e/utils/**',
      ],
      // docs/DESIGN.md: Coverage thresholds
      thresholds: { 100: true },
    },
  },
});
