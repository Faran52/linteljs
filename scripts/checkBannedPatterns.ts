// At this path because the banned-pattern hook, lint-staged and `lint:types` all look for it.
import { spawnSync } from 'node:child_process';
import { globSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process, { argv, execPath } from 'node:process';

import {
  type BannedPattern,
  bannedReports,
  directive,
} from '../packages/create/templates/project/scripts/utils/bannedPatternsUtils.ts';
import { logError } from '../packages/create/templates/project/scripts/utils/loggerUtils.ts';

const SHIPPED = join(import.meta.dirname, '../packages/create/templates/project/scripts/checkBannedPatterns.ts');

// Coverage and mutation stand at 100% with no disable comment, so package source carries no ignore.
const COVERAGE_IGNORE: BannedPattern = {
  name: 'coverage ignore',
  re: directive(String.raw`(?:v8|c8|istanbul)\s+ignore`),
  inComments: true,
};

const PACKAGE_SOURCE = /(?:^|\/)packages\/[^/]+\/src\//;

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

const shipped = spawnSync(execPath, [SHIPPED, ...files], { stdio: 'inherit' }).status ?? 1;

const packageSources = files
  .filter((file) => {
    return PACKAGE_SOURCE.test(file);
  });

const ignores = bannedReports(packageSources, {
  patterns: [COVERAGE_IGNORE],
  skipped: [],
  extensions: [],
});

for (const report of ignores) {
  logError(report);
}

if (ignores.length > 0) {
  logError('Cover the branch or delete it: package source carries no coverage ignore.');
}

process.exitCode = ignores.length > 0 ? 1 : shipped;
