/**
 * The string-literal keys a `Record<V, unknown>` carries, read off the object itself rather than cast: a filter
 * with a predicate rather than `Object.keys(...) as V[]`, so a caller's vocabulary is never spelled a second time.
 * Generic enough that every ring reaches for it, from a record's own `values` to a test fixture's.
 */
export const valuesOf = <V extends string>(values: Record<V, unknown>): V[] => {
  return Object.keys(values).filter((key): key is V => {
    return key in values;
  });
};
