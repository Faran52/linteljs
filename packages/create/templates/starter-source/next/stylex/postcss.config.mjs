/*
 * StyleX compiles through Babel and PostCSS here rather than a bundler plugin: Next owns its build and has no
 * Vite config to put one in. `.babelrc` is what compiles each style call, and this reads the sources back,
 * collects what it wrote, and emits the atomic rules where `@stylex;` sits in the style entry.
 *
 * JSON rather than `babel.config.js`, and `.mjs` rather than `.cjs`, because Next's Babel loader refuses an
 * `.mjs` or `.cjs` Babel config and this project is ESM, so neither file can be spelled the other way.
 *
 * `useCSSLayers` keeps the generated rules from outranking a hand-written one by specificity alone.
 */
const config = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{ts,tsx}'],
      useCSSLayers: true,
    },
  },
};

export default config;
