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

// The two fields this reads out of the packed `package.json`.
interface PackedManifest {
  name: string;
  exports: object;
}

const root = resolve(import.meta.dirname, '..');
const smokeDir = join(root, '.smoke');
const pkgDir = join(smokeDir, 'package');

const isPackedManifest = (value: unknown): value is PackedManifest => {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && typeof value.name === 'string'
    && 'exports' in value
    && typeof value.exports === 'object'
    && value.exports !== null;
};

const run = (cmd: string, args: string[], cwd = root): string => {
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

const manifest: unknown = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

assert.ok(isPackedManifest(manifest), 'the packed package.json has no `name` and `exports`');

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
  './react-native': 'reactNativeGroup',
  './next': 'nextGroup',
  './vue': 'vueGroup',
  './nuxt': 'nuxtGroup',
  './svelte': 'svelteGroup',
  './solid': 'solidGroup',
  './angular': 'angularGroup',
};

/**
 * A layer in `frameworks/` or `libraries/` is published two ways and lands half-published unless both are checked:
 * the subpath a project imports by name, and the barrel export the README's "compose layers yourself" needs.
 * `react-native` had neither and `tailwind` had no barrel export, so each was reachable only through
 * `defineConfig` while the README told consumers to use subpaths. The source directory is the list, so a new
 * layer is covered the day its file lands rather than the day someone remembers.
 */
const kebab = (name: string): string => {
  return name.replace(/[A-Z]/gu, (letter: string) => {
    return `-${letter.toLowerCase()}`;
  });
};

const layerNames = ['src/frameworks', 'src/libraries'].flatMap((dir) => {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => {
      return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts');
    })
    .map((entry) => {
      return entry.name.slice(0, -'.ts'.length);
    });
});

assert.ok(layerNames.length > 1, 'no layer modules found under src/frameworks or src/libraries');

for (const name of layerNames) {
  assert.ok(
    subpaths.includes(`./${kebab(name)}`),
    `src/**/${name}.ts has no "./${kebab(name)}" entry in exports`,
  );
}

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

console.log(`• loading ${String(subpaths.length)} subpaths`);
run('node', [join(smokeDir, 'probe.mjs')], smokeDir);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
console.log(`\n✓ all ${String(subpaths.length)} subpaths resolve from the packed tarball`);
