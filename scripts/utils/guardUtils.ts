// Not a plain-object check: a module namespace has a null prototype and its own tag.
export const isObjectValue = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const fieldOf = (value: unknown, key: string): unknown => {
  if (!isObjectValue(value) || !(key in value)) {
    return undefined;
  }

  return value[key];
};
