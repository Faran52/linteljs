// The prototype is the whole check: arrays, class instances and null-prototype records are refused.
export const isJsonObject = (value: unknown): value is object => {
  return typeof value === 'object'
    && value !== null
    && Object.getPrototypeOf(value) === Object.prototype;
};

// A predicate filter rather than `Object.keys(...) as V[]`.
export const valuesOf = <V extends string>(values: Record<V, unknown>): V[] => {
  return Object.keys(values)
    .filter((key): key is V => {
      return key in values;
    });
};

// Own rather than `in`, which takes `toString` for a key of every record.
export const isValueOf = <V extends string>(value: string, values: Record<V, unknown>): value is V => {
  return Object.hasOwn(values, value);
};

export const parsedAs = <T>(text: string | null, guard: (value: unknown) => value is T): T | null => {
  try {
    const parsed: unknown = JSON.parse(String(text));

    return guard(parsed) ? parsed : null;
  }
  catch {
    return null;
  }
};
