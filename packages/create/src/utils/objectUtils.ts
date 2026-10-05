import { isPlainObject } from 'es-toolkit';

// Narrows to `object` rather than es-toolkit's `Record<PropertyKey, any>`, so no `any` reaches a caller.
export const isJsonObject = (value: unknown): value is object => {
  return isPlainObject(value);
};

// `for...in` types a record's key as its key union, so neither a cast nor a filter is needed.
export const keysOf = <V extends string>(values: Record<V, unknown>): V[] => {
  const keys: V[] = [];

  for (const key in values) {
    keys.push(key);
  }

  return keys;
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
