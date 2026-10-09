import { isEqual, uniqWith } from 'es-toolkit';

export type ShareValue = string | number | boolean | null | ShareValue[] | Share;

// A drawer's `share.json`: what it adds to the files the assembler generates. A mapped type, since a `Record`
// alias cannot refer to itself.
export type Share = { [key in string]: ShareValue };

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isShare = (value: unknown): value is Share => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Objects merge deep and lists join without repeats; one key at two different values is an authoring error.
export const mergedShare = (left: Share, right: Share, at = ''): Share => {
  const merged: Share = { ...left };

  for (const [key, value] of Object.entries(right)) {
    const current = left[key];
    const path = at === '' ? key : `${at}.${key}`;

    if (current === undefined || isEqual(current, value)) {
      merged[key] = value;
    }
    else if (Array.isArray(current) && Array.isArray(value)) {
      merged[key] = uniqWith([...current, ...value], isEqual);
    }
    else if (isShare(current) && isShare(value)) {
      merged[key] = mergedShare(current, value, path);
    }
    else {
      throw new Error(`${path} is ${JSON.stringify(current)} in one drawer and ${JSON.stringify(value)} in another`);
    }
  }

  return merged;
};

export const shareOf = (share: Share, key: string): Share => {
  const value = share[key];

  if (value === undefined) {
    return {};
  }

  if (!isShare(value)) {
    throw new Error(`share key ${key} must be an object`);
  }

  return value;
};

export const stringsOf = (share: Share, key: string): string[] => {
  const value = share[key];

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || !value.every(isString)) {
    throw new Error(`share key ${key} must be a list of strings`);
  }

  return value;
};

export const stringRecordOf = (share: Share, key: string): Record<string, string> => {
  const entries = Object.entries(shareOf(share, key));
  const strings = entries
    .filter((entry): entry is [string, string] => {
      return isString(entry[1]);
    });

  if (strings.length !== entries.length) {
    throw new Error(`share key ${key} must map names to strings`);
  }

  return Object.fromEntries(strings);
};

export const stringOf = (share: Share, key: string): string => {
  const value = share[key];

  if (!isString(value)) {
    throw new Error(`share key ${key} must be a string`);
  }

  return value;
};
