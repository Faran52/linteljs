import { join } from 'node:path';

import { MANAGED_PATH } from '../config/constants';

import { readIfPresent } from './utils/fsUtils';

type JsonValue = null | boolean | number | string | object;

interface ManagedRecord {
  removable?: JsonValue;
}

const isManagedRecord = (value: unknown): value is ManagedRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * What a previous run recorded as its own. Absent, unreadable or malformed answers nothing, and nothing is the
 * safe direction to be wrong in: `sync` then adds what the answers ask for and removes none of what they no longer
 * do. A project written before this file existed reads that way once, and the same run writes the record.
 */
export const readManagedPaths = async (cwd: string): Promise<string[]> => {
  const text = await readIfPresent(join(cwd, MANAGED_PATH));

  if (text === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (!isManagedRecord(parsed) || !Array.isArray(parsed.removable)) {
      return [];
    }

    return parsed.removable.filter((entry) => {
      return typeof entry === 'string';
    });
  }
  catch {
    // A record this CLI cannot read is one it is about to replace.
    return [];
  }
};
