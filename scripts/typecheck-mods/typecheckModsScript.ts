// The Claude Code mods against the declarations the engine writes beside each when it loads it: `pnpm mod-types`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process, { env, execPath } from 'node:process';
import { fileURLToPath } from 'node:url';

import { rankOf } from '@utils/versionUtils';

import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';

import {
  MIN_ENGINE,
  MOD_DIRS,
  TYPES_FILE,
  WRITTEN_BY,
} from './constants.ts';

const TSC = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));

const engineOf = (dir: string): string | undefined => {
  const path = join(dir, TYPES_FILE);

  if (!existsSync(path)) {
    return undefined;
  }

  const text = readFileSync(path, 'utf8');
  const engine = WRITTEN_BY.exec(text)?.[1];

  return engine ?? '0.0.0';
};

const fails = (dir: string): boolean => {
  const engine = engineOf(dir);

  if (engine === undefined) {
    logError(`${dir} has no engine-written types: run \`pnpm mod-types\`.`);

    return true;
  }

  if (rankOf(engine) < rankOf(MIN_ENGINE)) {
    logError(`${dir} has Claude Code ${engine} types, older than ${MIN_ENGINE}: update, then run \`pnpm mod-types\`.`);

    return true;
  }

  const { status } = spawnSync(execPath, [
    TSC,
    '-p',
    join(dir, 'tsconfig.json'),
  ], { stdio: 'inherit' });

  return status !== 0;
};

// CI has no Claude Code to write the types; the gate runs where one does.
const { CI: ci } = env;
const absent = MOD_DIRS
  .some((dir) => {
    const written = existsSync(join(dir, TYPES_FILE));

    return !written;
  });

if (ci !== undefined && absent) {
  log('Mod typecheck skipped: CI has no Claude Code to write the mod types (`pnpm mod-types`).');
}
else {
  const failed = MOD_DIRS.filter(fails);

  process.exitCode = failed.length > 0 ? 1 : 0;
}
