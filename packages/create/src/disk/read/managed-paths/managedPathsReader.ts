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

/**
 * What a previous run recorded as its own. Absent, unreadable or malformed answers nothing, and nothing is the
 * safe direction to be wrong in: `sync` then adds what the answers ask for and removes none of what they no longer
 * do. A project written before this file existed reads that way once, and the same run writes the record.
 */
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
