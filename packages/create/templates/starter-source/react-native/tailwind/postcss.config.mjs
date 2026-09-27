// NativeWind reads Tailwind through PostCSS; without this config `@theme` and `@utility` reach Metro raw.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
