import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CONFIG_PATH,
  type LintelConfig,
  parseLintelConfig,
} from '../answers/lintelConfig';

export const readLintelConfig = async (cwd: string): Promise<LintelConfig> => {
  const path = join(cwd, CONFIG_PATH);
  let text: string;

  try {
    const entry = await lstat(path);

    if (entry.isSymbolicLink()) {
      throw new Error('lintel.config.json must be a regular file; symbolic links are not allowed');
    }

    if (!entry.isFile()) {
      throw new Error('lintel.config.json must be a regular file');
    }

    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

    try {
      // Asks the descriptor, catching a swap after the `lstat`; no test can stage the race.
      /* v8 ignore next 3 */
      if (!(await file.stat()).isFile()) {
        throw new Error('lintel.config.json must be a regular file');
      }

      text = await file.readFile('utf8');
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error('lintel.config.json was not found; this is not a LintelJS-managed project');
    }

    // The same race, answered with the message a named link gets.
    /* v8 ignore next 3 */
    if (error instanceof Error && 'code' in error && error.code === 'ELOOP') {
      throw new Error('lintel.config.json must be a regular file; symbolic links are not allowed');
    }

    throw error;
  }

  return parseLintelConfig(text);
};
