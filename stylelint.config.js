// No `postcss-html` override: that is for single-file components, and this workspace has none.
const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  overrides: [
    {
      // This workspace has no Tailwind to read four lines of the shipped theme bridge with.
      files: ['packages/create/templates/**/tailwind/**/*.css'],
      rules: {
        'at-rule-no-unknown': [true, { ignoreAtRules: ['theme', 'custom-variant'] }],
      },
    },
  ],
};

export default config;
