import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  dirname,
  join,
  resolve,
  sep,
} from 'node:path';

import type { EditInput } from './hostUtils.ts';

const CHECKED = /\.(?:ts|tsx|mts|cts|vue|svelte)$/u;
const CHECKER = join('scripts', 'checkBannedPatterns.ts');

// The payload's `cwd` need not be the project root, so the checker is searched for upwards.
// One candidate per path segment bounds the walk, which ends at the root.
const checkerAbove = (start: string): string | undefined => {
  let directory = start;
  const candidates = start
    .split(sep)
    .map(() => {
      const candidate = join(directory, CHECKER);
      directory = dirname(directory);

      return candidate;
    });

  return candidates
    .find((candidate) => {
      return existsSync(candidate);
    });
};

// `resolve` reads an empty `projectDir` as the cwd itself.
const findChecker = (cwd: string, projectDir: string | undefined): string | undefined => {
  const root = resolve(cwd, projectDir ?? cwd);

  return checkerAbove(root) ?? checkerAbove(cwd);
};

// `projectDir` is the host's `CLAUDE_PROJECT_DIR`, searched before the payload's `cwd`.
export const bannedPatternReason = (input: EditInput, projectDir: string | undefined): string | undefined => {
  const cwd = resolve(input.cwd);
  const resolved = input.paths
    .map((path) => {
      return resolve(cwd, path);
    });
  const files = new Set(resolved);

  for (const file of files) {
    if (!CHECKED.test(file) || !existsSync(file)) {
      continue;
    }

    // No checker anywhere above is a project with no floor to enforce, which is not a violation to report.
    const checker = findChecker(cwd, projectDir);

    if (checker === undefined) {
      return undefined;
    }

    const result = spawnSync(process.execPath, [checker, file]);

    if (result.status !== 0) {
      // stdout then stderr; `join` decodes each as UTF-8.
      const findings = result.output
        .join('')
        .trim();
      return `${file} now holds a banned pattern, so the edit was blocked. Build the real type instead of casting `
        + `or suppressing, then write the file again.\n${findings}`;
    }
  }

  return undefined;
};
