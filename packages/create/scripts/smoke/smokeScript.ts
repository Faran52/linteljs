// The `bin`, `files` and `templates/` are only wrong once packed.
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execPath } from 'node:process';

import { run, unpackTarball } from '../../../../scripts/utils/processUtils.ts';
import { log } from '../../templates/project/scripts/utils/loggerUtils.ts';

import { assertPacked, filesIn } from './utils/assetsUtils.ts';
import { assertHelp } from './utils/helpUtils.ts';

const root = resolve(import.meta.dirname, '../..');
const smokeDir = join(root, '.smoke');

log('packing and extracting the tarball');

const pkgDir = unpackTarball(root, smokeDir);

log('running the packed binary');

const help = run(execPath, [join(pkgDir, 'dist', 'create-linteljs.mjs'), '--help'], smokeDir);

assertHelp(help);

// `templatesRootFrom` walks up from the flattened `dist/`, a depth only the packed layout has.
const hasDist = existsSync(join(pkgDir, 'dist', 'index.mjs'));
const hasTemplates = existsSync(join(pkgDir, 'templates'));

assert.ok(hasDist, 'no dist/index.mjs in the tarball');
assert.ok(hasTemplates, 'no templates/ beside dist/ for the walk-up to find');

log('comparing the shipped asset tree against the tarball');

const packedFiles = filesIn(join(pkgDir, 'templates'));
const shipped = filesIn(join(root, 'templates'));

assertPacked(shipped, packedFiles);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});

log(`packed artifact smoke test passed: the binary documents its flags, ${String(packedFiles.length)} assets packed`);
