import { join } from 'node:path';

import { MANAGED_PATH } from '@config/constants';

import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { readIfPresent } from '../../utils/fsUtils';

import type { JsonValue } from '@answers';

interface ManagedRecord {
  removable?: JsonValue;
}

const isManagedRecord = (value: unknown): value is ManagedRecord => {
  return isJsonObject(value);
};

// Unreadable answers nothing, the safe direction: `sync` then removes nothing.
export const managedPathsReader = async (cwd: string): Promise<string[]> => {
  const record = parsedAs(await readIfPresent(join(cwd, MANAGED_PATH)), isManagedRecord);

  if (record === null || !Array.isArray(record.removable)) {
    return [];
  }

  return record.removable
    .filter((entry) => {
      return typeof entry === 'string';
    });
};
