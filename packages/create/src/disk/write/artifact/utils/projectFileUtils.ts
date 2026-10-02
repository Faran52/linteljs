import { constants } from 'node:fs';
import { mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';

import { hasCode } from '../../../utils/fsUtils';
import { safeProjectPath } from '../../../utils/pathUtils';

// Read and write for all, less the umask, as `writeFile` creates it.
const NEW_FILE_MODE = 0o666;

export const projectFileWriter = async (
  cwd: string,
  target: string,
  text: string,
): Promise<void> => {
  const path = await safeProjectPath(cwd, target);

  await mkdir(dirname(path), { recursive: true });
  // Walked again: the first walk stopped at the first missing parent.
  await safeProjectPath(cwd, target);

  try {
    // Never a symbolic link and whatever it points at.
    const file = await open(
      path,
      constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
      NEW_FILE_MODE,
    );

    try {
      await file.writeFile(text);
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (hasCode(error, 'ELOOP')) {
      throw new Error(`Refusing to write ${target}: target is a symbolic link`);
    }

    throw error;
  }
};
