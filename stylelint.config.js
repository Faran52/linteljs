// The same two presets every generated project gets. No `postcss-html` override: that is for single-file
// components, and a library monorepo has none. CLAUDE.md carries why the gate runs on a workspace with no CSS.
const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  overrides: [
    {
      /*
       * Tailwind's own at-rules, in the theme bridge this repository ships to a project that chose Tailwind. That
       * project lints them through `stylelint-config-tailwindcss`, which its emitted config extends; this
       * workspace has no Tailwind of its own and no reason to install one to read four lines of it.
       */
      files: ['packages/create/templates/**/tailwind/**/*.css'],
      rules: {
        'at-rule-no-unknown': [true, { ignoreAtRules: ['theme', 'custom-variant'] }],
      },
    },
  ],
};

export default config;
