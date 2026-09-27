// Next owns its build, so StyleX compiles through Babel and PostCSS.
// `.babelrc` as JSON: Next's Babel loader refuses an `.mjs` or `.cjs` Babel config.
const config = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{ts,tsx}'],
      useCSSLayers: true,
    },
  },
};

export default config;
