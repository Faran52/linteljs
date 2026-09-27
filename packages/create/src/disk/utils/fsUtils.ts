import {
  accessSync,
  constants,
  statSync,
} from 'node:fs';
import {
  access,
  lstat,
  readFile,
} from 'node:fs/promises';
import { join } from 'node:path';

interface CodedError extends Error {
  code: string;
}

// `node:fs` is importable from `disk/` alone, so this is the one place to substitute.
export {
  rm,
  rmdir,
} from 'node:fs/promises';

// Sync because its answer feeds a `spawnSync`: `spawns/` resolves a binary with no asynchronous point to wait at.
export const isExecutableFile = (path: string): boolean => {
  try {
    accessSync(path, constants.X_OK);

    return statSync(path).isFile();
  }
  catch {
    return false;
  }
};

// By code: `ENOENT` for absence, so a permission error stays an error.
export const hasCode = (error: unknown, code: string): error is CodedError => {
  return error instanceof Error && 'code' in error && error.code === code;
};

// An unreachable path reads as absent, since nothing here decides what to overwrite.
export const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);

    return true;
  }
  catch {
    return false;
  }
};

// Including a dangling symbolic link.
export const entryExists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);

    return true;
  }
  catch (error) {
    if (hasCode(error, 'ENOENT')) {
      return false;
    }

    throw error;
  }
};

export const readIfPresent = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  }
  catch (error) {
    if (hasCode(error, 'ENOENT')) {
      return null;
    }

    throw error;
  }
};

export const allPresent = async (cwd: string, candidates: string[]): Promise<string[]> => {
  const checked = candidates
    .map(async (candidate) => {
      return await entryExists(join(cwd, candidate)) ? candidate : undefined;
    });

  const found = await Promise.all(checked);

  return found
    .filter((candidate) => {
      return candidate !== undefined;
    });
};
