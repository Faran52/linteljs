import { lstat } from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

import { hasCode } from './fsUtils';

// The one gate every write goes through: a target outside the project, or reached through a symbolic link a
// scaffolder left behind, is refused rather than followed.
export const safeProjectPath = async (cwd: string, target: string): Promise<string> => {
  const root = resolve(cwd);
  const path = resolve(root, target);
  const relativePath = relative(root, path);

  if (
    isAbsolute(target)
    || relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
  ) {
    throw new Error(`Refusing to use ${target}: target must be a relative path inside the project`);
  }

  let parent = root;

  for (const segment of dirname(relativePath).split(sep)) {
    if (segment === '.') {
      continue;
    }

    parent = join(parent, segment);

    try {
      if ((await lstat(parent)).isSymbolicLink()) {
        throw new Error(`Refusing to use ${target}: a parent directory is a symbolic link`);
      }
    }
    catch (error) {
      if (hasCode(error, 'ENOENT')) {
        break;
      }

      throw error;
    }
  }

  return path;
};
