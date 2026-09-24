import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  cacheDir: '.vitest-cache',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    unstubGlobals: true,
    watch: false,
    pool: 'threads',
    testTimeout: 30000,
    include: ['src/**/*.test.ts'],
  },
};

export default defineConfig(config);
