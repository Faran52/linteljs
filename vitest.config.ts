import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],
    coverage: {
      provider: 'v8',
      // The real-code audit's split-out helpers carry suites of their own; the rest of scripts/ has none yet.
      include: [
        'packages/*/src/**/*.ts',
        'packages/eslint-plugin/scripts/audit/real-code/utils/{attribution,finding,fix,fixPass,optionSweep}Utils.ts',
      ],
      // The e2e harness, which spawns, publishes and needs the registry, and so runs only under `test:e2e`. The
      // case matrix under `e2e/matrix/` is pure and runs in the default suite, so it is held to the gate.
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
        '**/e2e/*.ts',
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
