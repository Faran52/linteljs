import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  dirname,
  join,
  resolve,
} from 'node:path';

import {
  type EditInput,
  readEdit,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const CHECKED = /\.(?:ts|tsx|mts|cts|vue|svelte)$/u;
const CHECKER = join('scripts', 'checkBannedPatterns.ts');

// The payload's `cwd` need not be the project root, so the checker is searched for upwards.
const checkerAbove = (start: string): string | undefined => {
  let directory = start;
  for (;;) {
    const candidate = join(directory, CHECKER);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
};

const findChecker = (cwd: string): string | undefined => {
  const projectDir = process.env['CLAUDE_PROJECT_DIR'];
  return (projectDir === undefined || projectDir === '' ? undefined : checkerAbove(projectDir)) ?? checkerAbove(cwd);
};

const decide = (input: EditInput): string | undefined => {
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
    const checker = findChecker(cwd);
    if (checker === undefined) {
      return undefined;
    }
    const result = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
    if (result.status !== 0) {
      const findings = `${result.stdout}${result.stderr}`.trim();
      return `${file} now holds a banned pattern, so the edit was blocked. Build the real type instead of casting `
        + `or suppressing, then write the file again.\n${findings}`;
    }
  }
  return undefined;
};

const payload = readPayload();
const input = payload === undefined ? undefined : readEdit(payload);

if (input !== undefined) {
  writeDecision(input.host, 'block', decide(input));
}
