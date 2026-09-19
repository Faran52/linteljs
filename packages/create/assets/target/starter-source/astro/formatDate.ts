/**
 * A page renders this; a page does not compute it.
 *
 * A `.astro` template has no client runtime and no renderer to mount it with, so nothing in one is unit-testable and
 * nothing in one is measured by the coverage gate. Anything with a branch therefore belongs here, in `lib/`, where a
 * test can call it directly. This function is the smallest honest example of that rule, and `testing.astro.md` is the
 * long form of it.
 */
export const formatDate = (value: Date, locale = 'en-GB'): string => {
  return value.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
