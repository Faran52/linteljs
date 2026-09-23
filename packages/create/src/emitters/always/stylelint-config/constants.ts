// The rule tables this emitter writes, and the shape of an override block.

export interface StyleOverride {
  files: string;
  body: string[];
}

// A CSS module's class names are camelCase JS properties; the kebab-case demand is the one finding `--fix` cannot
// clear.
export const CSS_MODULE_OVERRIDE: StyleOverride = {
  files: '**/*.module.css',
  body: [
    'rules: {',
    "  'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',",
    '},',
  ],
};

// A Tailwind 4 `@custom-variant` body is a bare `&` rule, which stylelint reads as dangling. A Tailwind project only.
export const TAILWIND_RULES = ["  'nesting-selector-no-missing-scoping-root': null,"];

/*
 * One notation in every project, and it is the string one. `stylelint-config-standard` prefers `url()`, and
 * Tailwind 4's entry has to be `@import "tailwindcss";`, so taking the default would mean one notation with that
 * answer and another without it. Pinned rather than turned off: the point is that every import in a project agrees.
 */
export const IMPORT_NOTATION = ["  'import-notation': 'string',"];
