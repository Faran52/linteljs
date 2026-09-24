import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CONFIG_PATH,
  LEGACY_CONFIG_PATH,
  type LinteljsConfig,
  parseLinteljsConfig,
} from '#answers';

import { entryExists } from '../../utils/fsUtils';

// `linteljs.config.json`, or the `linteljs.config.json` a version through 1.6.0 wrote. The older name is read and
// never written, so the first `create` or `sync` after an upgrade records the new one and `sync` clears the old.
const configPath = async (cwd: string): Promise<string> => {
  return await entryExists(join(cwd, CONFIG_PATH))
    ? join(cwd, CONFIG_PATH)
    : join(cwd, LEGACY_CONFIG_PATH);
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
      // Asks the descriptor, catching a swap after the `lstat`; no test can stage the race.
      /* v8 ignore next 3 */
      if (!(await file.stat()).isFile()) {
        throw new Error('linteljs.config.json must be a regular file');
      }

      text = await file.readFile('utf8');
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error('linteljs.config.json was not found; this is not a LintelJS-managed project');
    }

    // The same race, answered with the message a named link gets.
    /* v8 ignore next 3 */
    if (error instanceof Error && 'code' in error && error.code === 'ELOOP') {
      throw new Error('linteljs.config.json must be a regular file; symbolic links are not allowed');
    }

    throw error;
  }

  return parseLinteljsConfig(text);
};
