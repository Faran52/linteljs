import { join } from 'node:path';

import { MANAGED_PATH } from '@config/constants';

import { isJsonObject } from '@utils/objectUtils';

import { readIfPresent } from '../../utils/fsUtils';

import type { JsonValue } from '@answers';

interface ManagedRecord {
  removable?: JsonValue;
}

const isManagedRecord = (value: unknown): value is ManagedRecord => {
  return isJsonObject(value);
};

// The record, where there is one and it parses; one this CLI cannot read is one it is about to replace.
const recordIn = (text: string | null): ManagedRecord | null => {
  try {
    // No record reads as JSON `null`, which is no record either.
    const parsed: unknown = JSON.parse(String(text));

    return isManagedRecord(parsed) ? parsed : null;
  }
  catch {
    return null;
  }
};

/**
 * What a previous run recorded as its own. Absent, unreadable or malformed answers nothing, and nothing is the
 * safe direction to be wrong in: `sync` then adds what the answers ask for and removes none of what they no longer
 * do. A project written before this file existed reads that way once, and the same run writes the record.
 */
export const managedPathsReader = async (cwd: string): Promise<string[]> => {
  const record = recordIn(await readIfPresent(join(cwd, MANAGED_PATH)));

  if (record === null || !Array.isArray(record.removable)) {
    return [];
  }

  return record.removable.filter((entry) => {
    return typeof entry === 'string';
  });
};
