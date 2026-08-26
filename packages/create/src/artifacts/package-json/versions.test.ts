import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { parsePackageJson } from './emitPackageJson';
import { PACKAGE_MANAGER_VERSIONS, VERSIONS } from './versions';

interface Sibling {
  name: string;
  version: string;
}

/**
 * The only ranges in VERSIONS this repository can check for itself; everything else names a registry version, and
 * asserting on those would hit the network. @linteljs/eslint-config sat at ^0.1.0 while the package it names had
 * reached 0.2.0: a caret on 0.x is minor-locked, and the emitter tests (which assert on text, not resolution) missed
 * it.
 */
const WORKSPACE_PACKAGES = ['eslint-config', 'eslint-plugin'];

const siblingIn = (directory: string): Sibling => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', directory, 'package.json');
  const { name, version } = parsePackageJson(readFileSync(path, 'utf8'));

  if (name === undefined || version === undefined) {
    throw new Error(`${path} declares no name or version`);
  }

  return {
    name,
    version,
  };
};

describe('VERSIONS against the workspace', () => {
  it.each(WORKSPACE_PACKAGES)('carries no stale range for %s', (directory) => {
    const { name, version } = siblingIn(directory);
    const range = VERSIONS[name];

    // Only @linteljs/eslint-config is written into a generated project; the plugin arrives as its dependency and
    // needs no range of its own.
    expect(range === undefined || range === `^${version}`).toBe(true);
  });

  it('names the one package a generated project depends on', () => {
    expect(VERSIONS[siblingIn('eslint-config').name]).toBeDefined();
  });
});

/**
 * The `catalog:` in `pnpm-workspace.yaml` is the one version of a dependency this workspace installs, so an entry that
 * appears in both places must not ship a generated project something older than the layers it installs were built
 * against. Read with a line match rather than a YAML parser: the block is flat `name: range` pairs, and a parser
 * dependency for eight lines is the tail wagging the dog.
 */
const catalogEntries = (): [string, string][] => {
  const yaml = readFileSync(join(import.meta.dirname, '..', '..', '..', '..', '..', 'pnpm-workspace.yaml'), 'utf8');
  const lines = yaml.split('\n');
  const start = lines.indexOf('catalog:');

  if (start === -1) {
    throw new Error('pnpm-workspace.yaml declares no catalog');
  }

  const entries: [string, string][] = [];

  // Indented lines belong to the block; the first one starting at column 0 ends it. Line-by-line rather than one
  // pattern over the whole file, because a regex that spans a block is the shape `sonarjs/slow-regex` reports.
  for (const line of lines.slice(start + 1)) {
    const indented = line.startsWith(' ') || line.startsWith('\t');

    if (!indented && line.trim() !== '') {
      break;
    }

    const trimmed = line.trim();
    const separator = trimmed.indexOf(':');

    if (trimmed.startsWith('#') || separator === -1) {
      continue;
    }

    const name = trimmed.slice(0, separator).replaceAll("'", '');

    entries.push([name, trimmed.slice(separator + 1).trim()]);
  }

  return entries;
};

// Floor of a range, as numbers, so `^10.8.1` and `~10.8.1` compare as 10.8.1 rather than as strings.
const floorOf = (range: string): number[] => {
  return range.replace(/^[\^~]/, '').split('.').map(Number);
};

const atLeast = (range: string, minimum: string): boolean => {
  const left = floorOf(range);
  const right = floorOf(minimum);

  return left.every((part, index) => {
    const other = right[index] ?? 0;

    // Equal so far: keep reading. The first part that differs decides it.
    return part === other || part > other || left.slice(0, index).some((earlier, at) => {
      return earlier > (right[at] ?? 0);
    });
  });
};

/**
 * The layers were built and tested against whatever `@linteljs/eslint-config` declares, so a range in `VERSIONS` that
 * is older hands a generated project a plugin its own config has never run against. The catalog block above covers
 * the five dependencies this workspace shares; these are the two dozen it does not, and five of them had already
 * drifted before anything checked. `catalog:` entries are skipped here, since the block above is where they answer.
 */
const configDependencies = (): [string, string][] => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', 'eslint-config', 'package.json');
  const { devDependencies } = parsePackageJson(readFileSync(path, 'utf8'));

  return Object.entries(devDependencies ?? {}).filter(([, range]) => {
    return range !== 'catalog:';
  });
};

describe('VERSIONS against the config it installs beside', () => {
  it('reads dependencies off the config, so the assertion below is not vacuous', () => {
    expect(configDependencies().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version the layers were built against', () => {
    const stale = configDependencies()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, eslint-config has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});

/**
 * `packageManager` in a generated project is written from `PACKAGE_MANAGER_VERSIONS`, and pnpm rewrites this
 * workspace's own field on every install. Without this the two drift apart silently, which is how a project was being
 * pinned to 11.21.0 by a workspace running 11.24.0.
 */
describe('PACKAGE_MANAGER_VERSIONS against the workspace', () => {
  it('pins pnpm no older than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    expect(atLeast(PACKAGE_MANAGER_VERSIONS.pnpm, running)).toBe(true);
  });
});

describe('VERSIONS against the workspace catalog', () => {
  it('reads a catalog with entries in it, so the assertion below is not vacuous', () => {
    expect(catalogEntries().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const stale = catalogEntries()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, catalog has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});
