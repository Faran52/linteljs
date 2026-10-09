import {
  arrayLiteral,
  configSource,
  objectLiteral,
} from '@emitters';
import { quote } from '@emitters/utils/quoteUtils';

import {
  isShare,
  type Share,
  type ShareValue,
  stringRecordOf,
  stringsOf,
} from '../../utils/shareUtils';

const sourceOf = (options: Share, key: string, value: ShareValue): string => {
  if (typeof value === 'string') {
    return quote(value);
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const strings = stringsOf(options, key);

    return arrayLiteral(key, strings);
  }

  if (isShare(value)) {
    const record = stringRecordOf(options, key);
    const entries = Object.entries(record);

    return objectLiteral(entries, 1);
  }

  throw new Error(`eslint option ${key} cannot be null`);
};

// The `eslint` share is the options `composeConfig` takes, each written as source.
export const eslintConfigWriter = (options: Share): string => {
  const rows = Object.entries(options)
    .map(([key, value]) => {
      const row: [string, string] = [key, sourceOf(options, key, value)];

      return row;
    });

  return configSource(rows);
};
