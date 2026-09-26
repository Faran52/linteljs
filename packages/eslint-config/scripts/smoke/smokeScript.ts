/**
 * Smoke test for the packed tarball: links it under `node_modules` and imports every `exports` subpath by package
 * name. An `exports` entry with no tsdown entry typechecks, builds and publishes, then 404s on a consumer's import.
 *
 * Usage: tsx scripts/smoke/smokeScript.ts
 */
import assert from 'node:assert/strict';
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
import { execPath } from 'node:process';

import { run, unpackTarball } from '../../../../scripts/utils/processUtils.ts';
import { log } from '../../../create/templates/project/scripts/utils/loggerUtils.ts';

// The two fields this reads out of the packed `package.json`.
interface PackedManifest {
  name: string;
  exports: object;
}

const root = resolve(import.meta.dirname, '../..');
const smokeDir = join(root, '.smoke');

const isPackedManifest = (value: unknown): value is PackedManifest => {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && typeof value.name === 'string'
    && 'exports' in value
    && typeof value.exports === 'object'
    && value.exports !== null;
};

log('packing and extracting the tarball');

const pkgDir = unpackTarball(root, smokeDir);

const manifest: unknown = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

assert.ok(isPackedManifest(manifest), 'the packed package.json has no `name` and `exports`');

// Linked rather than installed, so the package's own dependencies resolve out of the workspace.
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
  './react-native': 'reactNativeGroup',
  './next': 'nextGroup',
  './vue': 'vueGroup',
  './nuxt': 'nuxtGroup',
  './svelte': 'svelteGroup',
  './solid': 'solidGroup',
  './angular': 'angularGroup',
};

// Each layer directory needs both its subpath, which is its kebab name, and its barrel export, which is that name in
// camelCase; the directories are the list.
const camel = (name: string): string => {
  return name.replace(/-([a-z])/gu, (_match, letter: string) => {
    return letter.toUpperCase();
  });
};

const layerDirs = ['src/layers', 'src/frameworks', 'src/libraries'].flatMap((dir) => {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => {
      return entry.isDirectory() && entry.name !== 'utils';
    })
    .map((entry) => {
      return entry.name;
    });
});

assert.ok(layerDirs.length > 1, 'no layer directories found under src/layers, src/frameworks or src/libraries');

for (const dir of layerDirs) {
  assert.ok(subpaths.includes(`./${dir}`), `src/**/${dir}/ has no "./${dir}" entry in exports`);
}

const layerNames = layerDirs.map(camel);

const specifiers = subpaths.map((subpath) => {
  return {
    subpath,
    specifier: manifest.name + subpath.slice(1),
  };
});

const checks = `
import assert from 'node:assert/strict';

const GROUP_EXPORTS = ${JSON.stringify(GROUP_EXPORTS)};

const LAYER_NAMES = ${JSON.stringify(layerNames)};

export const check = async (subpath, namespace) => {
  const label = subpath;

  if (subpath === '.') {
    // The barrel has no default export; it re-exports every layer by name.
    assert.equal(typeof namespace.base, 'function', label + ': barrel does not export base');

    for (const name of LAYER_NAMES) {
      assert.equal(typeof namespace[name], 'function', label + ': barrel does not export ' + name);
    }

    return;
  }

  assert.equal(typeof namespace.default, 'function', label + ': default export is not a function');

  // \`compose-config\` answers a promise and a layer an array; awaiting covers both.
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

log(`loading ${String(subpaths.length)} subpaths`);
run(execPath, [join(smokeDir, 'probe.mjs')], smokeDir);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
log(`all ${String(subpaths.length)} subpaths resolve from the packed tarball`);
