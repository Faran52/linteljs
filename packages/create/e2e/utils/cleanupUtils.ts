import { rm } from 'node:fs/promises';

export const removeDir = async (dir: string): Promise<void> => {
  await rm(dir, {
    recursive: true,
    force: true,
  });
};

// Each case removes its own tree, so no hook is left a whole target's installs to delete inside its timeout.
export const removedAfter = async (dir: string, work: () => Promise<void>): Promise<void> => {
  try {
    await work();
  }
  finally {
    await removeDir(dir);
  }
};
