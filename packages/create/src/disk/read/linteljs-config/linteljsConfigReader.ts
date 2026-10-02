import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CONFIG_PATH,
  LEGACY_CONFIG_PATH,
  type LinteljsConfig,
  parseLinteljsConfig,
} from '@answers';

import { entryExists, hasCode } from '../../utils/fsUtils';

// The older name is read and never written; `create --existing` and `sync` clear it.
const configPath = async (cwd: string): Promise<string> => {
  const current = join(cwd, CONFIG_PATH);
  const hasCurrent = await entryExists(current);

  return hasCurrent ? current : join(cwd, LEGACY_CONFIG_PATH);
};

export const linteljsConfigReader = async (cwd: string): Promise<LinteljsConfig> => {
  const path = await configPath(cwd);
  let text: string;

  try {
    const entry = await lstat(path);

    if (entry.isSymbolicLink()) {
      throw new Error('linteljs.config.json must be a regular file; symbolic links are not allowed');
    }

    if (!entry.isFile()) {
      throw new Error('linteljs.config.json must be a regular file');
    }

    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

    try {
      // Asks the descriptor, catching a swap after the `lstat`.
      const openedEntry = await file.stat();

      if (!openedEntry.isFile()) {
        throw new Error('linteljs.config.json must be a regular file');
      }

      const bytes = await file.readFile();

      text = bytes.toString('utf8');
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (hasCode(error, 'ENOENT')) {
      throw new Error('linteljs.config.json was not found; this is not a LintelJS-managed project');
    }

    // The same race, answered with the message a named link gets.
    if (hasCode(error, 'ELOOP')) {
      throw new Error('linteljs.config.json must be a regular file; symbolic links are not allowed');
    }

    throw error;
  }

  return parseLinteljsConfig(text);
};
