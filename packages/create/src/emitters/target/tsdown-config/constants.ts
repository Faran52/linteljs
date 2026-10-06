// `neutral`: the default `node` platform names the output `.mjs`, which the package.json exports do not.
export const TSDOWN_CONFIG = `import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  dts: true,
});
`;
