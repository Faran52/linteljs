/**
 * A parsed JSON object, which is the one boundary shape this package meets in every ring: a config it reads back,
 * a `package.json` it merges into, a manifest, an agent settings file. Each caller narrows to its own shape and
 * declares that in its own return type; what they share is the question of whether there is an object there at all.
 *
 * The prototype is the whole check. Four of the five guards this replaced also tested `!Array.isArray(value)`,
 * which never decided anything: an array's prototype is `Array.prototype`, so it is already refused, as is a class
 * instance and an `Object.create(null)` record.
 */
export const isJsonObject = (value: unknown): value is object => {
  return typeof value === 'object'
    && value !== null
    && Object.getPrototypeOf(value) === Object.prototype;
};

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

// Whether a string read off the outside world is one of a record's own keys, narrowed to that key's union. Own
// rather than `in`, which takes `toString` for a key of every record.
export const isValueOf = <V extends string>(value: string, values: Record<V, unknown>): value is V => {
  return Object.hasOwn(values, value);
};
