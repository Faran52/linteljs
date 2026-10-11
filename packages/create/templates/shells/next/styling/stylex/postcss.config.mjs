// Next owns its build, so StyleX compiles through Babel and PostCSS.
// `.babelrc` as JSON, which Next's loader insists on, so its `@styles` alias is `/ROOT/` under a `rootDir`.
const config = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{ts,tsx}'],
      useCSSLayers: { before: ['reset'] },
    },
  },
};

export default config;
