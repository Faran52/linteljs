// At this path because the banned-pattern hook, lint-staged and `lint:types` all look for it.
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

// Expanded here: the shipped walk reads `.ts` and `.tsx` only and cannot drop an exempt file.
const filesUnder = (path: string): string[] => {
  const paths = statSync(path, { throwIfNoEntry: false })?.isDirectory() === true
    ? globSync(`${path}/**/*.{ts,tsx,mts,cts}`)
    : [path];

  return paths;
};

const files = argv
  .slice(2)
  .flatMap(filesUnder)
  .filter((file) => {
    return !SKIPPED
      .some((fragment) => {
        return file.includes(fragment);
      });
  });

process.exitCode = spawnSync(execPath, [SHIPPED, ...files], { stdio: 'inherit' }).status ?? 1;
