/**
 * Smoke test for the packed tarball: the `bin`, the `files` list and the `templates/` beside `dist/` are only wrong
 * once packed, and an asset missing from the tarball passes every test here and dies in a generated project.
 *
 * Usage: jiti scripts/smoke/smokeScript.ts
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { execPath } from 'node:process';

import { log } from '../../../../scripts/utils/loggerUtils.ts';
import { run, unpackTarball } from '../../../../scripts/utils/processUtils.ts';

const root = resolve(import.meta.dirname, '../..');
const smokeDir = join(root, '.smoke');

// Every option `parseCliArgs` accepts, at a word boundary: `--skip` was once a prefix of another flag.
const FLAGS = ['--existing', '--no-install', '--seed', '--skip', '--yes', '-y', '--force', '--help', '-h'];
const STAGES = ['lint', 'package', 'standard', 'install', 'fix'];

// Beside the script it spawns, and negated in `files` so a generated project inherits no test for a file it owns.
const EXCLUDED = /^project\/(?:scripts|plugins)\/(?:.*\/)?[^/]+\.test\.ts$/;

log('packing and extracting the tarball');

const pkgDir = unpackTarball(root, smokeDir);

log('running the packed binary');

const help = run(execPath, [join(pkgDir, 'dist', 'create-linteljs.mjs'), '--help'], smokeDir);

for (const flag of FLAGS) {
  assert.match(help, new RegExp(`${flag}(?![\\w-])`), `--help does not mention ${flag}`);
}

for (const stage of STAGES) {
  assert.match(help, new RegExp(`\\b${stage}\\b`), `--help does not mention the ${stage} stage`);
}

assert.match(help, /@linteljs\/create sync/, '--help does not mention the sync command');

// `templatesRootFrom` walks up from the flattened `dist/`, a depth only the packed layout has.
assert.ok(existsSync(join(pkgDir, 'dist', 'index.mjs')), 'no dist/index.mjs in the tarball');
assert.ok(existsSync(join(pkgDir, 'templates')), 'no templates/ beside dist/ for the walk-up to find');

log('comparing the shipped asset tree against the tarball');

const filesIn = (dir: string): string[] => {
  // `readdirSync` rather than a glob, whose `*` skips dotfiles.
  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => {
    return entry.isFile();
  }).map((entry) => {
    return join(entry.parentPath, entry.name).slice(dir.length + 1);
  });
};

const packed = new Set(filesIn(join(pkgDir, 'templates')));
const shipped = filesIn(join(root, 'templates'));
const leaked = shipped.filter((name) => {
  return EXCLUDED.test(name) && packed.has(name);
});
const missing = shipped.filter((name) => {
  return !EXCLUDED.test(name) && !packed.has(name);
});

assert.deepEqual(leaked, [], `excluded by \`files\` but packed:\n  ${leaked.join('\n  ')}`);
assert.deepEqual(missing, [], `assets in the repo that \`files\` did not pack:\n  ${missing.join('\n  ')}`);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
log(`packed artifact smoke test passed: the binary documents its flags, ${String(packed.size)} assets packed`);
