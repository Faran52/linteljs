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

// Absence only: a permission error stays an error.
interface NotFound {
  code: 'ENOENT';
}

/**
 * The filesystem itself, re-exported rather than reached for directly everywhere. `node:fs` is importable from
 * `files/` alone, enforced in the root `eslint.config.ts`, so this is the one place the rest of the package
 * substitutes when it needs to run without touching a disk.
 */
export {
  mkdir,
  readFile,
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

// Absence only: a permission error stays an error.
export const isAbsence = (error: unknown): error is Error & NotFound => {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
};

// Presence for an async caller; an unreachable path reads as absent, since nothing here decides what to overwrite.
export const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);

    return true;
  }
  catch {
    return false;
  }
};

// The entry itself, including a dangling symbolic link.
export const entryExists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);

    return true;
  }
  catch (error) {
    if (isAbsence(error)) {
      return false;
    }

    throw error;
  }
};

// The file's text, or null when it does not exist yet.
export const readIfPresent = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  }
  catch (error) {
    if (isAbsence(error)) {
      return null;
    }

    throw error;
  }
};

// All present candidates, in the order given; which one a project means is `projectSpelling`'s decision.
export const allPresent = async (cwd: string, candidates: string[]): Promise<string[]> => {
  const found = await Promise.all(candidates.map(async (candidate) => {
    return await entryExists(join(cwd, candidate)) ? candidate : undefined;
  }));

  return found.filter((candidate) => {
    return candidate !== undefined;
  });
};
