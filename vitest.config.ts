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
