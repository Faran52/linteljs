/**
 * Smoke test for the *packed* artifact. `pnpm test` exercises the TypeScript sources, which resolve by relative
 * path and so say nothing about the `exports` map; this packs the tarball, extracts it, links it under a
 * `node_modules` so imports go through the package name, and loads every declared subpath. The failure it
 * exists for: an `exports` entry with no matching `tsdown` entry, which typechecks, builds, publishes, then
 * 404s on a consumer's first import. A directory or file path would resolve past the map and prove nothing.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  join,
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

const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

/**
 * Linked rather than installed: Node walks up from `.smoke/` for everything else, so the package's own
 * dependencies still resolve out of the workspace's `node_modules`. The link's parent is made from the
 * manifest name, because a scoped package puts the scope directory between `node_modules` and the link.
 */
const linkPath = join(smokeDir, 'node_modules', manifest.name);

mkdirSync(dirname(linkPath), { recursive: true });
symlinkSync(pkgDir, linkPath, 'dir');

// `./package.json` is a plain string target with no layer behind it.
const subpaths = Object.keys(manifest.exports).filter((subpath) => {
  return subpath !== './package.json';
});
assert.ok(subpaths.length > 1, 'exports map has no layer subpaths');

// The sort bucket each framework layer publishes. `@linteljs/create` writes `base({ frameworkGroup: reactGroup })`,
// so a missing one breaks generated projects only: nothing in this repository would notice.
const GROUP_EXPORTS = {
  './react': 'reactGroup',
  './next': 'nextGroup',
  './vue': 'vueGroup',
  './svelte': 'svelteGroup',
  './solid': 'solidGroup',
  './angular': 'angularGroup',
};

const specifiers = subpaths.map((subpath) => {
  return {
    subpath,
    specifier: manifest.name + subpath.slice(1),
  };
});

const checks = `
import assert from 'node:assert/strict';

const GROUP_EXPORTS = ${JSON.stringify(GROUP_EXPORTS)};

export const check = async (subpath, namespace) => {
  const label = subpath;

  if (subpath === '.') {
    // The barrel has no default export; it re-exports every layer by name.
    assert.equal(typeof namespace.base, 'function', label + ': barrel does not export base');
    assert.equal(typeof namespace.react, 'function', label + ': barrel does not export react');

    return;
  }

  assert.equal(typeof namespace.default, 'function', label + ': default export is not a function');

  // Awaited: \`define-config\` loads its layers on demand and so hands back a promise, while a
  // layer hands back the array itself, and awaiting an array is the array.
  const configs = await namespace.default();

  assert.ok(Array.isArray(configs), label + ': layer() did not return an array');
  assert.ok(configs.length > 0, label + ': layer() returned an empty array');

  const group = GROUP_EXPORTS[subpath];

  if (group) {
    assert.ok(Array.isArray(namespace[group]), label + ': ' + group + ' is not an array');
    assert.ok(namespace[group].length > 0, label + ': ' + group + ' is empty');
  }
};
`;

writeFileSync(join(smokeDir, 'checks.mjs'), checks);

const esmProbe = [
  "import { check } from './checks.mjs';",
  '',
  ...specifiers.map(({ subpath, specifier }) => {
    return `await check(${JSON.stringify(subpath)}, await import(${JSON.stringify(specifier)}));`;
  }),
  '',
].join('\n');

writeFileSync(join(smokeDir, 'probe.mjs'), esmProbe);

console.log(`• loading ${subpaths.length} subpaths`);
run('node', [join(smokeDir, 'probe.mjs')], smokeDir);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
console.log(`\n✓ all ${subpaths.length} subpaths resolve from the packed tarball`);
