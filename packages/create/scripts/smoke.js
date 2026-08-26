/**
 * Smoke test for the *packed* artifact.
 *
 * `pnpm test` exercises the TypeScript sources, and `test:e2e` scaffolds for real but runs on
 * main rather than on a pull request. Between them sits the class of defect neither catches: a
 * `files` list, a `bin` entry or an `exports` map that is wrong only once the tarball exists.
 *
 * The failure it exists for: `buildArtifacts` names every shipped file by string, and
 * `buildArtifacts.test.ts` resolves those names against the *workspace* `assets/`. What reaches a
 * user is whatever `files` packed. An asset present in the repo and absent from the tarball passes
 * every test in this package and then dies in a generated project on "no such file or directory".
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import {
  join,
  relative,
  resolve,
} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const smokeDir = join(root, '.smoke');
const pkgDir = join(smokeDir, 'package');

const run = (cmd, args, cwd = root) => {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
};

const filesUnder = (dir) => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
};

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
mkdirSync(smokeDir, { recursive: true });

console.log('• packing tarball');
run('pnpm', ['pack', '--pack-destination', smokeDir]);

const tarball = readdirSync(smokeDir).find((file) => {
  return file.endsWith('.tgz');
});
assert.ok(tarball, 'pnpm pack produced no tarball');

console.log(`• extracting ${tarball}`);
run('tar', ['-xzf', join(smokeDir, tarball)], smokeDir);

/**
 * The binary a user reaches through `pnpm create @linteljs`, run from the extracted tarball, not the workspace.
 * It resolves `../dist/index.mjs` relatively, so a `files` list that packed `bin` and forgot `dist` fails here and
 * nowhere else.
 */
console.log('• running the packed binary');

const help = run(process.execPath, [join(pkgDir, 'bin', 'create-linteljs.js'), '--help'], smokeDir);

/**
 * Every option `parseCliArgs` accepts, against what `--help` prints. The one that went missing was `--skip`: accepted,
 * undocumented, invisible to a test that only parses argv. Matched at a word boundary because `--skip` is a prefix of
 * `--skip-scaffold`, so `includes` passed with the line documenting it deleted.
 */
for (const flag of [
  '--skip-scaffold',
  '--no-install',
  '--fresh',
  '--skip',
  '--yes',
  '-y',
  '--force',
  '--help',
  '-h',
]) {
  assert.match(help, new RegExp(`${flag}(?![\\w-])`), `--help does not mention ${flag}`);
}

// Every stage `--skip` accepts, so a renamed one cannot leave the help text naming the old word.
for (const stage of ['scaffold', 'lint', 'package', 'standard', 'install', 'fix']) {
  assert.match(help, new RegExp(`\\b${stage}\\b`), `--help does not mention the ${stage} stage`);
}

assert.match(help, /@linteljs\/create sync/, '--help does not mention the sync command');

console.log('  ✓ binary runs from the tarball and documents its flags');

// `assets/` beside `dist/`, which is what `assetsRootFrom` walks up to find. In the workspace it starts from
// `src/run/` and here from the flattened `dist/`, so the published depth is only exercised by the packed layout.
assert.ok(existsSync(join(pkgDir, 'dist', 'index.mjs')), 'no dist/index.mjs in the tarball');
assert.ok(existsSync(join(pkgDir, 'assets')), 'no assets/ beside dist/ for the walk-up to find');

// The whole shipped tree, workspace against tarball. Stricter than enumerating targets: it needs
// no answers to be right, and an asset added for a future target is covered the day it lands.
console.log('• comparing the shipped asset tree against the tarball');

const packed = new Set(filesUnder(join(pkgDir, 'assets')).map((file) => {
  return relative(join(pkgDir, 'assets'), file);
}));

// The one deliberate exclusion. Both `assets/scripts/*.test.ts` sit beside the script they spawn, a shipped asset with
// no `src/` counterpart, and `files` negates them so a generated project inherits no test for a file it now owns.
const excluded = /^scripts\/.*\.test\.ts$/;
const missing = [];

for (const file of filesUnder(join(root, 'assets'))) {
  const name = relative(join(root, 'assets'), file);

  if (excluded.test(name)) {
    assert.ok(!packed.has(name), `${name} is excluded by \`files\` but reached the tarball`);
    continue;
  }

  if (!packed.has(name)) {
    missing.push(name);
  }
}

assert.deepEqual(missing, [], `assets in the repo that \`files\` did not pack:\n  ${missing.join('\n  ')}`);

console.log(`  ✓ all ${String(packed.size)} shipped assets packed, test fixtures excluded`);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
console.log('✓ packed artifact smoke test passed');
