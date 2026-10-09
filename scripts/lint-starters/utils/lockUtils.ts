import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';

import { hasCode } from '@disk/utils/fsUtils';

import { logWarn } from '../../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { LOCK, LOCK_POLL_MS } from '../constants.ts';

// A holder another user owns is no gate of ours, so any refusal reads as gone.
const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);

    return true;
  }
  catch {
    return false;
  }
};

const claimed = (): boolean => {
  try {
    writeFileSync(LOCK, String(process.pid), { flag: 'wx' });

    return true;
  }
  catch (error) {
    if (!hasCode(error, 'EEXIST')) {
      throw error;
    }

    return false;
  }
};

// Undefined while the holder is releasing the lock or has not written its pid yet.
const holderOf = (): number | undefined => {
  try {
    const pid = Number(readFileSync(LOCK, 'utf8'));

    return pid > 0 ? pid : undefined;
  }
  catch (error) {
    if (!hasCode(error, 'ENOENT')) {
      throw error;
    }

    return undefined;
  }
};

const release = (): void => {
  rmSync(LOCK, { force: true });
};

// Checkouts share one cache, so a second run waits rather than prune the first one's tarballs and clear its
// projects. A holder killed outright leaves its pid behind, and the next run takes the lock over.
export const acquireLock = async (): Promise<void> => {
  mkdirSync(dirname(LOCK), { recursive: true });

  let warned = false;

  while (!claimed()) {
    const holder = holderOf();

    if (holder !== undefined && !isAlive(holder)) {
      release();
      continue;
    }

    if (holder !== undefined && !warned) {
      logWarn(`Waiting for the starter lint already running as pid ${String(holder)} (${LOCK}).`);
      warned = true;
    }

    await setTimeout(LOCK_POLL_MS);
  }

  process.on('exit', release);
};
