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

const GROUPS: Record<string, string> = {
  frameworks: 'Framework',
  layers: 'Layer',
  libraries: 'Library',
};

const entryNameOf = (subject: string, suffix: string): string => {
  return `${subject
    .replace(/-([a-z])/gu, (_match, letter: string) => {
      return letter.toUpperCase();
    })}${suffix}`;
};

const subjects = Object.entries(GROUPS)
  .flatMap(([group, suffix]) => {
    const groupDir = join(srcDir, group);
    return readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => {
        return entry.isDirectory() && entry.name !== 'utils';
      })
      .map((entry) => {
        const subject = {
          group,
          name: entry.name,
          entry: entryNameOf(entry.name, suffix),
        };
        return subject;
      });
  });

const byName = (left: string, right: string): number => {
  return left.localeCompare(right, 'en');
};

const groups = Object.keys(GROUPS);

describe.each(groups)('%s', (group) => {
  it('holds no loose file', () => {
    const groupDir = join(srcDir, group);
    const groupFiles = readdirSync(groupDir, { withFileTypes: true })
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

    const expected = [`${entry}.ts`, `${entry}.test.ts`];
    expect(files).toEqual(expect.arrayContaining(expected));

    const strays = files
      .filter((file) => {
        const allowed = [
          `${entry}.ts`,
          `${entry}.test.ts`,
          'constants.ts',
          'utils',
        ];
        return !allowed.includes(file);
      });

    expect(strays).toEqual([]);
  });
});

it('holds compose-config to its entry, its suite and its loaders', () => {
  const composeDir = join(srcDir, 'compose-config');
  const composeFiles = readdirSync(composeDir)
    .toSorted(byName);

  const expected = [
    'composeConfig.test.ts',
    'composeConfig.ts',
    'utils',
  ];
  expect(composeFiles).toEqual(expected);

  const utilsDir = join(composeDir, 'utils');
  const composeUtils = readdirSync(utilsDir)
    .toSorted(byName);

  const expectedUtils = ['loaderUtils.test.ts', 'loaderUtils.ts'];
  expect(composeUtils).toEqual(expectedUtils);
});

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
        const target = join(srcDir, '..', path);
        return !existsSync(target);
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
