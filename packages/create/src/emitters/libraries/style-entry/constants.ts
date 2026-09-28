// `@stylex;` is appended: it expands to rules, and a rule ahead of an `@import` invalidates it.
export const TAILWIND_IMPORT = '@import "tailwindcss";';

export const STYLEX_AT_RULE = '@stylex;';

// Also matches `@import url("tailwindcss") source(none)`.
export const IMPORTS_TAILWIND = /@import\s+(?:url\(\s*)?['"]tailwindcss(?:\/[^'"]*)?['"]/;

export const IMPORT_SPECIFIER = /@import\s+["']([^"']+)["']/gu;
