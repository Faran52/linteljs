/**
 * The two lines this emitter writes that are not an `@import`, and the pattern that recognises one of them.
 *
 * A utility class only exists because a stylesheet imported the framework, and only `create-next-app --tailwind`
 * writes that line itself.
 *
 * Where StyleX compiles through PostCSS, `@stylex;` is the at-rule its plugin expands into every atomic rule it
 * wrote. It is appended rather than prepended, and it is the one line that is: what it expands to is rules, and a
 * rule ahead of an `@import` makes that import invalid.
 */
export const TAILWIND_IMPORT = '@import "tailwindcss";';

export const STYLEX_AT_RULE = '@stylex;';

// Either quoting, the `url()` form and a subpath: `@import url("tailwindcss") source(none)` once read as no import.
export const IMPORTS_TAILWIND = /@import\s+(?:url\(\s*)?['"]tailwindcss(?:\/[^'"]*)?['"]/;
