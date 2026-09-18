import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

const emittersDir = join(import.meta.dirname);

// `config/` holds the data tables and `utils/` the helpers every emitter shares. Neither writes a file, so neither
// is a subject directory and neither is held to the shape below.
const SHARED = new Set(['config', 'utils']);

const subjectDirectories = readdirSync(emittersDir, { withFileTypes: true }).filter((entry) => {
  return entry.isDirectory() && !SHARED.has(entry.name);
}).map((entry) => {
  return entry.name;
});

const entriesIn = (directory: string): string[] => {
  return readdirSync(join(emittersDir, directory));
};

// Every file a subject owns, its own and the private helpers under `utils/`, relative to the subject directory.
const modulesIn = (directory: string): string[] => {
  return readdirSync(join(emittersDir, directory), {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile();
  }).map((entry) => {
    return relative(join(emittersDir, directory), join(entry.parentPath, entry.name));
  });
};

const sourcesUnder = (directory: string): string[] => {
  return readdirSync(directory, {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile() && entry.name.endsWith('.ts');
  }).map((entry) => {
    return join(entry.parentPath, entry.name);
  });
};

// Every module in the package, so a private helper reached from outside its own subject is caught wherever it is
// reached from rather than only where it was expected.
const packageSources = sourcesUnder(join(emittersDir, '..'));

describe('every emitter directory', () => {
  it('is named for a file rather than for a mechanism', () => {
    expect(subjectDirectories.length).toBeGreaterThan(0);
    expect(subjectDirectories.filter((name) => {
      return ['helpers', 'shared', 'common', 'core', 'lib', 'misc'].includes(name);
    })).toEqual([]);
  });

  describe.each(subjectDirectories)('%s', (directory) => {
    // `index` means a barrel in this package and `emitters/index.ts` is the only one. A subject directory holding
    // an implementation under that name has two names for the same thing and neither is searchable.
    it('holds no index', () => {
      expect(entriesIn(directory)).not.toContain('index.ts');
    });

    // Complements the naming map, which can only see a file it already expects to find: a stray directory or a
    // README nobody renders would otherwise sit here unnoticed.
    it('holds nothing but its modules and a utils directory', () => {
      const strays = entriesIn(directory).filter((entry) => {
        return !entry.endsWith('.ts') && entry !== 'utils';
      });

      expect(strays).toEqual([]);
    });

    it('suffixes every private helper and puts it under utils', () => {
      const misplaced = modulesIn(directory).filter((file) => {
        return file.includes('/') && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/.test(file);
      });

      expect(misplaced).toEqual([]);
    });

    /**
     * What makes a helper private is that one subject reads it. A second reader means it belongs to the ring rather
     * than to this directory, and `emitters/utils/` is where it goes. Checked by reading the import sites, because
     * a helper that quietly gained a second consumer still passes every other assertion here.
     */
    it('keeps every module under its utils private to itself', () => {
      const helpers = modulesIn(directory).filter((file) => {
        return file.startsWith('utils/') && !file.endsWith('.test.ts');
      });

      const leaked = helpers.filter((helper) => {
        const specifier = `${directory}/${helper.replace(/\.ts$/u, '')}`;

        return packageSources.some((source) => {
          return !source.startsWith(join(emittersDir, directory))
            && readFileSync(source, 'utf8').includes(specifier);
        });
      });

      expect(leaked).toEqual([]);
    });
  });
});
