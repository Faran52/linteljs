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
        'packages/create/templates/project/**/utils/*.ts',
        'packages/eslint-plugin/scripts/audit/real-code/utils/{attribution,finding,fix,fixPass,optionSweep}Utils.ts',
        'packages/eslint-plugin/scripts/audit/mutation-summary/utils/summaryUtils.ts',
        'packages/eslint-plugin/scripts/audit/false-negatives/utils/{edit,shapes}Utils.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
      ],
      // docs/DESIGN.md: Coverage thresholds
      thresholds: { 100: true },
    },
  },
});
