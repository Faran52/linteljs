import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { EXCLUDED_MOD_TYPECHECK, EXCLUDED_TEST } from '../constants.ts';

const isExcluded = (name: string): boolean => {
  return EXCLUDED_TEST.test(name) || EXCLUDED_MOD_TYPECHECK.test(name);
};

export const filesIn = (dir: string): string[] => {
  // A glob's `*` skips dotfiles.
  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      return join(entry.parentPath, entry.name).slice(dir.length + 1);
    });
};

export const assertPacked = (shipped: string[], packedFiles: string[]): void => {
  const packed = new Set(packedFiles);
  const leaked = shipped
    .filter((name) => {
      return isExcluded(name) && packed.has(name);
    });
  const missing = shipped
    .filter((name) => {
      return !isExcluded(name) && !packed.has(name);
    });

  assert.deepEqual(leaked, [], `excluded by \`files\` but packed:\n  ${leaked.join('\n  ')}`);
  assert.deepEqual(missing, [], `assets in the repo that \`files\` did not pack:\n  ${missing.join('\n  ')}`);
};
