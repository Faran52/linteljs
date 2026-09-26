/**
 * The shipped floor, run over this workspace less its exemptions. It sits at this path because the banned-pattern
 * hook, lint-staged and `lint:types` all look for `scripts/checkBannedPatterns.ts`.
 *
 * Usage: node scripts/checkBannedPatterns.ts packages/create/src packages/create/src/cli.ts
 */
import { spawnSync } from 'node:child_process';
import { globSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process, { argv, execPath } from 'node:process';

const SHIPPED = join(import.meta.dirname, '../packages/create/templates/project/scripts/checkBannedPatterns.ts');

// Each reason is in `.claude/rules/type-standards.md`.
const SKIPPED = [
  'packages/eslint-config/src/utils/presetUtils.ts',
  'packages/eslint-plugin/src/meta.test.ts',
  'packages/create/templates/project/src/typings/',
];

// Expanded here, not by the shipped walk, which reads `.ts` and `.tsx` only and cannot drop an exempt file it finds.
const filesUnder = (path: string): string[] => {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true
    ? globSync(`${path}/**/*.{ts,tsx,mts,cts}`)
    : [path];
};

const files = argv.slice(2).flatMap(filesUnder).filter((file) => {
  return !SKIPPED.some((fragment) => {
    return file.includes(fragment);
  });
});

process.exitCode = spawnSync(execPath, [SHIPPED, ...files], { stdio: 'inherit' }).status ?? 1;
