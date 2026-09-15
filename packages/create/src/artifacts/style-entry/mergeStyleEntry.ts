// A utility class only exists because a stylesheet imported the framework, and only `create-next-app --tailwind`
// writes that line itself. Merged, because the rest of the file is the project's theme.

export const TAILWIND_IMPORT = '@import "tailwindcss";';

// Either quoting, the `url()` form and a subpath: `@import url("tailwindcss") source(none)` once read as no import.
const IMPORTS_TAILWIND = /@import\s+(?:url\(\s*)?['"]tailwindcss(?:\/[^'"]*)?['"]/;

export const mergeStyleEntry = (current: string | null, imports: string[] = [TAILWIND_IMPORT]): string => {
  const block = imports.join('\n');

  if (current === null) {
    return `${block}\n`;
  }

  if (IMPORTS_TAILWIND.test(current)) {
    return current;
  }

  // Prepended: `no-invalid-position-at-import-rule` reports an `@import` after a rule.
  return `${block}\n\n${current}`;
};
