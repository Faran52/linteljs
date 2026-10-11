// Without it Turbopack reads `@theme` and `@custom-variant` as plain CSS and Tailwind never runs.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
