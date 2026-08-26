/**
 * The stylesheet named by `styleEntry`, guaranteed to pull Tailwind in. Installing `tailwindcss` and calling the Vite
 * plugin generates nothing on its own: a utility class only exists because some CSS file imported the framework, and
 * only `create-next-app --tailwind` writes that line itself. Merged rather than emitted, because the rest of the file
 * is the project's theme.
 */

export const TAILWIND_IMPORT = '@import "tailwindcss";';

// Either quoting and the `url()` form: a project's own `@import url("tailwindcss") source(none)` read as no import at
// all, so a second unrestricted one went in above it and undid the scan restriction.
const IMPORTS_TAILWIND = /@import\s+(?:url\(\s*)?['"]tailwindcss['"]/;

export const mergeStyleEntry = (current: string | null): string => {
  if (current === null) {
    return `${TAILWIND_IMPORT}\n`;
  }

  if (IMPORTS_TAILWIND.test(current)) {
    return current;
  }

  // Prepended, not appended: `no-invalid-position-at-import-rule` reports an `@import` sitting after a rule, and the
  // cascade puts the framework's own layers first anyway.
  return `${TAILWIND_IMPORT}\n\n${current}`;
};
