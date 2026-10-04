import { spawnSync } from 'node:child_process';

import { logError } from './loggerUtils.ts';

const ANSI_ESCAPE_GLOBAL = /\u001b\[[0-9;]*m/g;

const normalizePath = (filePath: string): string => {
  const normalized = filePath.replaceAll('\\', '/');
  const srcIndex = normalized.indexOf('src/');
  return srcIndex === -1 ? normalized : normalized.slice(srcIndex);
};

// The output of a failed run, or null when it passed.
const failedOutput = (command: string): string | null => {
  const {
    status,
    stdout,
    stderr,
  } = spawnSync(command, { shell: true });

  return status === 0 ? null : `${String(stdout)}\n${String(stderr)}`;
};

// Keeps only the errors in the staged files.
export const typecheckStaged = (staged: string[], command: string): number => {
  const stagedFiles = staged.map(normalizePath);

  if (stagedFiles.length === 0) {
    return 0;
  }

  const output = failedOutput(command);

  if (output === null) {
    return 0;
  }

  const errors = output
    .split('\n')
    .filter((line) => {
      const normalizedLine = line.replace(ANSI_ESCAPE_GLOBAL, '');

      if (!normalizedLine.includes(' - error TS') && !normalizedLine.includes('): error TS')) {
        return false;
      }

      return stagedFiles
        .some((file) => {
          return normalizedLine.includes(file);
        });
    });

  if (errors.length === 0) {
    return 0;
  }

  logError(`TypeScript errors in staged files:\n${errors.join('\n')}`);

  return 1;
};
