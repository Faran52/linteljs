export interface StyleOverride {
  files: string;
  body: string[];
}

// A CSS module's class names are camelCase JS properties, which `--fix` cannot clear.
export const CSS_MODULE_OVERRIDE: StyleOverride = {
  files: '**/*.module.css',
  body: [
    'rules: {',
    "  'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',",
    '},',
  ],
};

// A Tailwind 4 `@custom-variant` body is a bare `&` rule, which stylelint reads as dangling.
export const TAILWIND_RULES = ["  'nesting-selector-no-missing-scoping-root': null,"];

// Pinned to the string form: Tailwind 4's entry must be `@import "tailwindcss";`, and every import should agree.
export const IMPORT_NOTATION = ["  'import-notation': 'string',"];
