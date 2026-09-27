import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import packageJson from '../package.json';
import tsdownConfig from '../tsdown.config';

const srcDir = import.meta.dirname;

// The suffix a subject's entry takes, keyed by the group that decides it.
const GROUPS: Record<string, string> = {
  frameworks: 'Framework',
  layers: 'Layer',
  libraries: 'Library',
};

const entryNameOf = (subject: string, suffix: string): string => {
  return `${subject.replace(/-([a-z])/gu, (_match, letter: string) => {
    return letter.toUpperCase();
  })}${suffix}`;
};

const subjects = Object.entries(GROUPS)
  .flatMap(([group, suffix]) => {
    return readdirSync(join(srcDir, group), { withFileTypes: true })
      .filter((entry) => {
        return entry.isDirectory() && entry.name !== 'utils';
      })
      .map((entry) => {
        return {
          group,
          name: entry.name,
          entry: entryNameOf(entry.name, suffix),
        };
      });
  });

const byName = (left: string, right: string): number => {
  return left.localeCompare(right, 'en');
};

describe.each(Object.keys(GROUPS))('%s', (group) => {
  // A group holds subjects and its shared `utils/`, so a layer file left loose beside them is one nothing pins.
  it('holds no loose file', () => {
    const groupFiles = readdirSync(join(srcDir, group), { withFileTypes: true })
      .filter((entry) => {
        return !entry.isDirectory();
      })
      .map((entry) => {
        return entry.name;
      });

    expect(groupFiles).toEqual([]);
  });
});

describe.each(subjects)('$group/$name', ({
  group,
  name,
  entry,
}) => {
  it('holds its entry and suite, and nothing but a constants.ts and a utils directory beside them', () => {
    const files = readdirSync(join(srcDir, group, name));

    expect(files).toEqual(expect.arrayContaining([`${entry}.ts`, `${entry}.test.ts`]));

    const strays = files
      .filter((file) => {
        return ![`${entry}.ts`, `${entry}.test.ts`, 'constants.ts', 'utils'].includes(file);
      });

    expect(strays).toEqual([]);
  });
});

// No group names a kind here, so the entry takes no suffix and is named for its directory.
it('holds compose-config to its entry, its suite and its loaders', () => {
  const composeFiles = readdirSync(join(srcDir, 'compose-config'))
    .toSorted(byName);

  expect(composeFiles).toEqual(['composeConfig.test.ts', 'composeConfig.ts', 'utils']);

  const composeUtils = readdirSync(join(srcDir, 'compose-config', 'utils'))
    .toSorted(byName);

  expect(composeUtils).toEqual(['loaderUtils.test.ts', 'loaderUtils.ts']);
});

// The source nests by subject while `exports` stays flat, so the keyed tsdown entries are the one join between them.
describe('tsdown entries', () => {
  const { entry } = tsdownConfig;
  const entries = typeof entry === 'object' && !Array.isArray(entry) ? Object.entries(entry) : [];

  it('each point at a file that exists', () => {
    expect(entries.length).toBeGreaterThan(0);

    const missing = entries
      .flatMap(([, path]) => {
        return path;
      })
      .filter((path) => {
        return !existsSync(join(srcDir, '..', path));
      });

    expect(missing).toEqual([]);
  });

  it('match the exports subpaths one to one', () => {
    const exported = Object.values(packageJson.exports)
      .flatMap((target) => {
        return typeof target === 'object' ? [target.import.default.replace(/^\.\/dist\/(.*)\.mjs$/u, '$1')] : [];
      });

    const entryKeys = entries
      .map(([key]) => {
        return key;
      })
      .toSorted(byName);

    expect(entryKeys).toEqual(exported.toSorted(byName));
  });
});
