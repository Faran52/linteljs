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
        'packages/create/e2e/matrix/matrix.ts',
        'packages/create/scripts/collect-builds/utils/{passes,probes}Utils.ts',
        'packages/eslint-plugin/scripts/audit/real-code/utils/{attribution,diff,finding,fix}Utils.ts',
        'packages/eslint-plugin/scripts/audit/real-code/utils/{fixPass,optionSweep,reportShape,timing}Utils.ts',
        'packages/eslint-plugin/scripts/audit/utils/{ast,corpus,lint,option}Utils.ts',
        'packages/eslint-plugin/scripts/audit/mutation-summary/utils/summaryUtils.ts',
        'packages/eslint-plugin/scripts/audit/false-negatives/utils/{edit,functionShapes,layoutShapes,shapes}Utils.ts',
        'packages/eslint-plugin/scripts/release/compat-matrix/utils/configUtils.ts',
        'packages/eslint-plugin/scripts/release/utils/eslintOutputUtils.ts',
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
